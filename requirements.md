# Cadence — Multi-IDE Support: Codex Prompts

> Feed these prompts to Codex (GPT-5.5) in order. Each is self-contained with full context.
> Paste the relevant files alongside each prompt as context.

---

## PROMPT 1 — Database Schema Migration (Multi-IDE)

**Files to attach:** `prisma/schema.prisma`, `README.md`

---

You are working on **cadence**, a Next.js 16 + Prisma + PostgreSQL app that tracks VS Code coding activity. We are extending it to support **multiple IDEs**: VS Code, Cursor, JetBrains (IntelliJ/WebStorm/PyCharm/GoLand/Rider), Zed, Neovim, and Sublime Text.

### Current schema (relevant parts):
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  apiKey        String?   @unique
  activities    Activity[]
  stats         UserStats?
  dailyContributions DailyContribution[]
}

model Activity {
  id         String   @id @default(cuid())
  userId     String
  startTime  DateTime
  endTime    DateTime
  duration   Int
  language   String?
  idleTime   Int      @default(0)
}

model DailyContribution {
  id           String   @id @default(cuid())
  userId       String
  date         DateTime
  totalMinutes Int
  sessionCount Int      @default(0)
}
```

### Your task:
Update `prisma/schema.prisma` to support multi-IDE tracking. Make these exact changes:

1. **Add `ide` field to `Activity`**:
   - Field name: `ide`
   - Type: `String`
   - Default: `"vscode"`
   - Add an index on `(userId, ide)` for fast per-IDE queries

2. **Add `ide` field to `DailyContribution`**:
   - Field name: `ide`
   - Type: `String`
   - Default: `"vscode"`
   - The unique constraint (if any exists on `userId + date`) must become `(userId, date, ide)` — one row per user per day per IDE
   - Add index on `(userId, ide)`

3. **Create a new `UserIdeSetup` model**:
   ```
   - id: cuid primary key
   - userId: String (relation to User)
   - ide: String  (e.g. "vscode", "cursor", "jetbrains", "zed", "neovim", "sublime")
   - label: String? (optional user-set display name like "WebStorm" or "PyCharm")
   - apiKey: String? @unique  (per-IDE API key, nullable — share the user's main apiKey if null)
   - isActive: Boolean @default(true)
   - connectedAt: DateTime @default(now())
   - lastHeartbeat: DateTime?
   - @@unique([userId, ide])
   ```
   Add this relation to the User model as `ideSetups UserIdeSetup[]`

4. **Update `UserStats` model** (if it exists) to add:
   - No change needed — stats are computed from activities

### IDE identifier enum (do NOT use a Prisma enum, use plain strings for flexibility):
```
"vscode"      → VS Code
"cursor"      → Cursor
"jetbrains"   → JetBrains (covers all JB IDEs)
"zed"         → Zed
"neovim"      → Neovim
"sublime"     → Sublime Text
```

### After updating schema, write a migration script `scripts/migrate-ide.ts`:
- Sets `ide = "vscode"` on all existing `Activity` rows where `ide IS NULL`
- Sets `ide = "vscode"` on all existing `DailyContribution` rows where `ide IS NULL`
- Run with: `npx ts-node scripts/migrate-ide.ts`

Output the complete updated `schema.prisma` and the migration script.

---

## PROMPT 2 — Backend API: IDE-Aware Heartbeat + Analytics

**Files to attach:** `app/api/heartbeat/route.ts`, `app/api/analytics/route.ts`, `app/api/contributions/route.ts`, `app/api/apikey/route.ts`, `lib/prisma.ts`, updated `schema.prisma` from Prompt 1

---

You are extending **cadence**'s backend API to support multiple IDEs. The database schema now has `ide` fields on `Activity` and `DailyContribution`, and a new `UserIdeSetup` model (see schema).

### TASK A — Update `app/api/heartbeat/route.ts`

The heartbeat endpoint receives pings from IDE extensions. Update it to:

1. **Accept `ide` in the request body** (alongside existing `language`, `project`, `filename`, `timestamp`). Default to `"vscode"` if not provided.
   ```typescript
   const { language, project, filename, timestamp, ide = "vscode" } = await req.json()
   ```

2. **Validate `ide`** against the allowed list: `["vscode", "cursor", "jetbrains", "zed", "neovim", "sublime"]`. Return 400 if invalid.

3. **When creating/updating an Activity**, pass `ide` to the create call.

4. **When upserting DailyContribution**, include `ide` in the `where` clause:
   ```typescript
   where: { userId_date_ide: { userId, date: today, ide } }
   ```

5. **Upsert `UserIdeSetup`**: After a successful heartbeat, upsert a `UserIdeSetup` row:
   ```typescript
   await prisma.userIdeSetup.upsert({
     where: { userId_ide: { userId, ide } },
     update: { lastHeartbeat: new Date(), isActive: true },
     create: { userId, ide, isActive: true, lastHeartbeat: new Date() }
   })
   ```

6. Keep all existing logic (idle detection, session merging, etc.) unchanged.

---

### TASK B — Update `app/api/analytics/route.ts`

Add an optional `ide` query parameter:
- `GET /api/analytics` → returns analytics across ALL IDEs (combined)
- `GET /api/analytics?ide=vscode` → returns analytics filtered to VS Code only
- `GET /api/analytics?ide=cursor` → returns analytics filtered to Cursor only

When `ide` is provided, add `where: { ide }` to all Prisma Activity queries.
When `ide` is not provided (combined view), do NOT filter — aggregate everything.

Also add a new `ideBreakdown` field to the response when no `ide` param is given:
```typescript
// ideBreakdown: array of { ide, totalMinutes, percentage, sessionCount }
const ideBreakdown = await prisma.activity.groupBy({
  by: ['ide'],
  where: { userId },
  _sum: { duration: true },
  _count: { id: true },
  orderBy: { _sum: { duration: 'desc' } }
})
```

---

### TASK C — Update `app/api/contributions/route.ts`

Add optional `ide` query param same as analytics.
- No `ide` → return combined contributions across all IDEs
- `?ide=vscode` → filter to that IDE

When returning combined contributions, merge DailyContribution rows by date:
```typescript
// Group by date, sum totalMinutes across IDEs
```

---

### TASK D — New endpoint: `app/api/ide-setup/route.ts`

```
GET  /api/ide-setup         → returns all UserIdeSetup rows for the current user
POST /api/ide-setup         → creates or activates an IDE setup { ide, label? }
DELETE /api/ide-setup?ide=x → sets isActive=false for that IDE
```

GET response shape:
```typescript
{
  setups: Array<{
    ide: string,
    label: string | null,
    isActive: boolean,
    connectedAt: string,
    lastHeartbeat: string | null,
    isConnected: boolean  // true if lastHeartbeat within last 5 minutes
  }>
}
```

---

### TASK E — Update `app/api/apikey/route.ts`

The existing endpoint manages a single global API key. Keep it as-is.
Per-IDE keys are optional; for now all IDEs share the user's main API key.
Add a comment explaining this.

---

## PROMPT 3 — IDE Selector Popup Component

**Files to attach:** `components/` directory listing, existing dashboard component, `app/dashboard/page.tsx` or similar

---

You are building a UI component for **cadence**, a Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui app. The app now supports multiple IDEs and the user needs a way to switch between them.

The existing design is clean, minimal, monochrome (black/white/gray), uses a serif display font for large headings (similar to editorial design), and is grid-based.

### Build: `components/IdeSelector.tsx`

This is a **floating pill/button** in the top-right area of the dashboard (next to the user avatar) that opens a **popup panel** showing all IDEs.

**Visual reference**: Think of it like the macOS menu bar app switcher — a small button showing the current IDE's icon + name, clicking it opens a clean dropdown with all IDEs listed.

**Behavior:**
- Shows the currently active IDE icon + name on the button (e.g., VS Code icon + "VS Code")
- Clicking opens a dropdown panel
- Panel shows all supported IDEs in a grid (2 columns on desktop, 1 on mobile)
- Each IDE card shows: icon (SVG), name, connection status dot (green = connected, gray = not setup, yellow = setup but not recently active), and time tracked this week
- Clicking a connected/setup IDE switches the dashboard to that IDE's data
- Clicking an unsetup IDE shows a small tooltip: "Not set up yet — go to Setup"
- There's a "Combined View" option at the top of the panel (globe/merge icon)
- The selected IDE has a subtle black border/ring

**Props:**
```typescript
interface IdeSelectorProps {
  currentIde: string | 'combined'
  setups: IdeSetup[]
  onSelect: (ide: string | 'combined') => void
}

interface IdeSetup {
  ide: string
  label: string | null
  isActive: boolean
  isConnected: boolean
  weeklyMinutes: number
}
```

**IDE definitions** (hardcode this list in a `lib/ide-config.ts` file):
```typescript
export const IDE_CONFIG = {
  vscode: {
    name: 'VS Code',
    color: '#007ACC',
    icon: 'vscode', // SVG component name
  },
  cursor: {
    name: 'Cursor',
    color: '#000000',
    icon: 'cursor',
  },
  jetbrains: {
    name: 'JetBrains',
    color: '#FE315D',
    icon: 'jetbrains',
  },
  zed: {
    name: 'Zed',
    color: '#084CCF',
    icon: 'zed',
  },
  neovim: {
    name: 'Neovim',
    color: '#57A143',
    icon: 'neovim',
  },
  sublime: {
    name: 'Sublime Text',
    color: '#FF9800',
    icon: 'sublime',
  },
}
```

**Also build: `components/IdeIcon.tsx`** — a component that renders an SVG icon for each IDE using their real logo shapes (simplified, single-color SVG paths). Use actual recognizable shapes:
- VS Code: the split-square logo
- Cursor: the "C" cursor logo  
- JetBrains: the JB box logo
- Zed: the "Z" letter mark
- Neovim: the NeoVim diamond/triangle
- Sublime Text: the mountain shape

Keep all icons the same size (default 20×20) and accept a `size` prop. Icons should be monochrome (fill with `currentColor`) so they adapt to light/dark modes.

**Styling rules:**
- Use the same monochrome aesthetic as the rest of the app
- The popup should have `border border-gray-200 rounded-xl shadow-lg bg-white`
- Connection status: green dot for connected, empty gray ring for not setup, filled gray dot for setup-but-idle
- Animate open/close with Framer Motion (`AnimatePresence` + slide down + fade)
- The component should be keyboard-accessible (Escape closes it)

---

## PROMPT 4 — Per-IDE Dashboard + Combined View

**Files to attach:** `app/dashboard/page.tsx`, all dashboard components in `components/`, `app/api/analytics/route.ts` (updated), `components/IdeSelector.tsx` (from Prompt 3)

---

You are updating the **cadence** dashboard to be fully IDE-aware.

### Current state:
The dashboard (`app/dashboard/page.tsx`) fetches analytics from `/api/analytics` and renders stats, contribution graph, top languages, project breakdown, weekly activity, 30-day trend, language mix, daily hours, productivity breakdown, goals, and achievements.

### Your task:

#### Part A — IDE state management in dashboard

Add a `selectedIde` state to the dashboard page:
```typescript
const [selectedIde, setSelectedIde] = useState<string | 'combined'>('combined')
```

Persist this to `localStorage` with key `cadence-selected-ide`.

Pass `selectedIde` to all API fetch calls as a query param:
- `/api/analytics?ide=vscode` (or no param for combined)
- `/api/contributions?ide=vscode`

When `selectedIde` changes, re-fetch all data.

#### Part B — IDE-aware header section

Replace the current session timer section header area with:

```
[IDE Selector Popup]   Connected since 09:11 AM — May 4   [Disconnect]
```

The IDE selector (from Prompt 3) goes in the top nav bar, to the left of the notification bell.

Below the welcome heading, add an IDE badge:
- If viewing a specific IDE: show `[IDE Icon] VS Code` pill badge in muted gray
- If viewing combined: show `[merge icon] All IDEs` pill badge

#### Part C — Combined View additions

When `selectedIde === 'combined'`, show an extra section called **"IDE Usage Breakdown"** between the contribution graph and the Top Languages section:

**IDE Usage Breakdown** section contains:
1. **Bar chart** — horizontal bars, one per IDE, showing total hours. Styled like the existing Weekly Activity bar chart (black bars, minimal).
2. **IDE cards row** — one card per setup IDE showing: IDE icon, name, total hours, active days, last session date. Cards are `w-fit` inline-flex, bordered, same card style as the stat cards at top.
3. **"Most used IDE" highlight** — a single line in small caps: `MOST ACTIVE: VS CODE — 87.4h this year`

#### Part D — Per-IDE empty state

When a user selects an IDE that hasn't been set up yet, instead of showing broken/empty charts, show a full-width empty state card:

```
[Large IDE Icon]
This IDE isn't set up yet.
Start tracking your Zed activity to see stats here.
[→ Go to Setup]  button
```

Style it as a centered card with a dashed border, consistent with the app's minimal aesthetic.

#### Part E — IDE label in existing sections

When viewing a specific IDE (not combined):
- Prepend the IDE name to section titles: "VS Code — Top Languages", "Cursor — Contribution Graph"
- Keep font/size same, just add the IDE name + em dash prefix in a lighter weight

---

## PROMPT 5 — Setup Page: Multi-IDE Flow

**Files to attach:** `app/dashboard/setup/page.tsx` (or wherever setup lives), `components/IdeSelector.tsx`, `lib/ide-config.ts`, `app/api/ide-setup/route.ts`

---

You are redesigning the **Setup** page in cadence to support multiple IDEs.

### Current setup flow:
1. Copy API key
2. Install VS Code extension  
3. Run command to paste API key in VS Code
4. Done

### New setup flow:

#### Step 1 — IDE selection grid

The page now starts with an IDE selection grid before showing setup instructions:

```
Choose your IDE
Set up tracking for one or more editors.

[VS Code ✓ connected]  [Cursor — click to set up]  [JetBrains — click to set up]
[Zed — click to set up]  [Neovim — click to set up]  [Sublime — click to set up]
```

Each IDE card:
- Icon (from `IdeIcon.tsx`)
- Name
- Status badge: "Connected", "Set up, idle", or "Not set up"
- Last active time if connected
- Clicking a connected IDE opens its setup/instructions panel (to reconfigure)
- Clicking a non-setup IDE opens the setup panel for that IDE

#### Step 2 — Per-IDE setup panel (shown after clicking an IDE)

The panel slides in (Framer Motion) showing IDE-specific instructions. Build this as `components/IdeSetupPanel.tsx` with a `ide: string` prop.

For each IDE, show:

**VS Code:**
```
1. Install the Cadence extension from the VS Code Marketplace
   [Open Marketplace →] button
2. Open Command Palette (Ctrl+Shift+P)
3. Run: "Cadence: Set API Key"
4. Paste your API key: [API Key field with copy button]
5. Done! Heartbeats will start appearing here.
```

**Cursor:**
```
Cursor is built on VS Code — use the same extension.
1. In Cursor, open Extensions (Ctrl+Shift+X)
2. Search "Cadence" and install
3. Open Command Palette → "Cadence: Set API Key"
4. Paste your API key: [API Key field with copy button]
Note: The extension sends ide="cursor" automatically when running in Cursor.
```

**JetBrains (IntelliJ / WebStorm / PyCharm / GoLand / Rider):**
```
1. Open your JetBrains IDE
2. Go to Settings → Plugins → Marketplace
3. Search "Cadence" (coming soon) — or use the manual install:
   [Download .jar plugin →]
4. After installing, go to Settings → Tools → Cadence
5. Paste your API key: [API Key field with copy button]
6. Set Heartbeat URL: [URL field - pre-filled with production URL]
```

**Zed:**
```
1. Open Zed's extension panel (Ctrl+Shift+X)  
2. Search "cadence" — or add to ~/.config/zed/extensions.json:
   { "cadence": "*" }
3. Add to ~/.config/zed/settings.json:
   {
     "vs_integrate": {
       "api_key": "YOUR_KEY",
       "heartbeat_url": "https://cadence.vercel.app/api/heartbeat"
     }
   }
4. Paste your API key: [API Key field with copy button]
```

**Neovim:**
```
1. Add the plugin to your config (lazy.nvim example):
   {
     "your-org/cadence.nvim",
     config = function()
       require("cadence").setup({
         api_key = "YOUR_KEY",
       })
     end
   }
2. Paste your API key: [API Key field with copy button]
3. Run :CadenceStart in Neovim
```

**Sublime Text:**
```
1. Install Package Control (if not already)
2. Open Command Palette → "Package Control: Install Package"
3. Search "Cadence" and install
4. Go to Preferences → Package Settings → Cadence → Settings
5. Add: { "api_key": "YOUR_KEY" }
6. Paste your API key: [API Key field with copy button]
```

#### Step 3 — Connection verification

Below the instructions, show a **live connection test** that polls `/api/heartbeat` (GET) every 5 seconds for 60 seconds:
- Waiting: "Waiting for first heartbeat from [IDE name]..."  (pulsing dot)
- Success: "✓ Connected! First heartbeat received." (green, auto-dismiss after 3s, redirect to dashboard)
- Timeout: "No heartbeat received. Double-check your API key and try again."

#### Additional UI notes:
- Keep the existing API key display card at the top of the page
- Add a "Which IDE are you using?" section header in the same serif display style as the rest of the app
- Already-connected IDEs show a checkmark badge on their card in the grid
- Multiple IDEs can be set up — the grid persists showing all statuses

---

## PROMPT 6 — Super / Combined Analytics Dashboard

**Files to attach:** `app/dashboard/page.tsx`, all chart components, `app/api/analytics/route.ts`, `lib/ide-config.ts`

---

You are building the **Combined IDE Analytics** ("Super Dashboard") view for cadence.

This view is shown when the user selects "All IDEs / Combined" from the IDE selector.

### New API endpoint: `app/api/analytics/combined/route.ts`

Build a dedicated combined analytics endpoint that returns:

```typescript
{
  // Overall totals
  totalHours: number,
  totalDays: number,
  longestStreak: number,
  currentStreak: number,

  // Per-IDE breakdown
  ideBreakdown: Array<{
    ide: string,
    totalMinutes: number,
    totalHours: number,
    percentage: number,         // % of total time
    activeDays: number,
    currentStreak: number,
    lastActive: string | null,
    topLanguage: string | null,
    topProject: string | null,
    weeklyMinutes: number,      // last 7 days
    monthlyMinutes: number,     // last 30 days
    dailyAvgMinutes: number,
  }>,

  // Combined contribution data (merged across IDEs by date)
  contributions: Array<{
    date: string,
    totalMinutes: number,
    byIde: Record<string, number>  // { vscode: 45, cursor: 30 }
  }>,

  // Cross-IDE language stats (merged)
  topLanguages: Array<{
    language: string,
    totalMinutes: number,
    percentage: number,
    ides: string[]  // which IDEs used this language
  }>,

  // Hourly productivity across all IDEs
  hourlyActivity: Array<{ hour: number, minutes: number }>,

  // Weekly trend per IDE (last 8 weeks)
  weeklyTrend: Array<{
    week: string,
    total: number,
    byIde: Record<string, number>
  }>
}
```

---

### Frontend: Combined Dashboard Sections

When `selectedIde === 'combined'`, replace/augment the normal dashboard sections with these:

#### Section 1 — IDE Usage Leaderboard
A ranked list of IDEs by total time. For each IDE:
- Rank number (1, 2, 3...)
- IDE icon + name
- Total hours (large number)
- Horizontal bar (proportional to max IDE)
- Active days + current streak  
- Last active timestamp
- "Most Used" badge on #1

Style: same card/section style as the rest of the app. Black bars. Clean.

#### Section 2 — Stacked Contribution Graph
Show the GitHub-style contribution graph but with stacked/segmented cells:
- Each day cell is still a square
- The darkness encodes total activity (same as before)
- On hover, the tooltip shows a breakdown by IDE: "VS Code: 45m, Cursor: 30m"
- Add a legend at the bottom: [VS Code ●] [Cursor ●] [JetBrains ●] (using the IDE brand colors, small dots only)

#### Section 3 — IDE Comparison Chart
A grouped bar chart showing the last 12 weeks, one group per week, bars per IDE:
- X-axis: week labels
- Y-axis: hours
- Each IDE gets its own bar in the group, colored by IDE brand color (use subtle colors — not harsh)
- Below the chart: "Your most productive IDE week was VS Code on May 4 with 14.2h"

Implement this as `components/IdeComparisonChart.tsx` using the existing charting library (check which one is used — looks like a custom SVG chart or Recharts).

#### Section 4 — Cross-IDE Insights (AI-generated insight cards)
Four stat insight cards (same style as the TOTAL HOURS / CURRENT STREAK cards at top):
1. `DOMINANT IDE` — "VS Code (68% of time)"
2. `MULTI-IDE DAYS` — "23 days coded in 2+ IDEs"
3. `IDE SWITCHES` — "Avg 1.3 IDEs per day"  
4. `COMBINED STREAK` — "15d (any IDE counts)"

#### Section 5 — Language Mix (Combined)
Same donut chart as existing, but now shows languages aggregated across all IDEs. Add a small note: "Across all IDEs"

#### Section 6 — Per-IDE Mini Cards
A horizontal scrollable row of compact per-IDE cards:
```
┌─────────────────┐
│ [VS Code icon]  │
│ VS Code         │
│ 89.4h           │
│ ● Connected     │
│ 13d streak      │
│ Top: TypeScript │
└─────────────────┘
```
Clicking a card navigates to that IDE's individual dashboard view.

---

## PROMPT 7 — IDE Extensions: Cursor, JetBrains, Zed

**Files to attach:** `vscode-extension/src/extension.ts`, `vscode-extension/package.json`

---

You are building IDE extensions/plugins for cadence to track coding activity across multiple editors.

The existing VS Code extension sends heartbeats to `POST /api/heartbeat` with:
```typescript
{
  timestamp: Date,
  language: string,
  project: string,
  filename: string,
  // NEW: ide field
  ide: "vscode" | "cursor" | "jetbrains" | "zed" | "neovim" | "sublime"
}
```

Authentication: `Authorization: Bearer {apiKey}` header.

---

### PART A — Update existing VS Code extension to send `ide`

In `vscode-extension/src/extension.ts`, detect whether the extension is running in VS Code or Cursor:

```typescript
function detectIde(): "vscode" | "cursor" {
  // Cursor sets a specific env variable or has a different appName
  const appName = vscode.env.appName.toLowerCase()
  if (appName.includes('cursor')) return 'cursor'
  return 'vscode'
}
```

Pass `ide: detectIde()` in every heartbeat payload.

Update `vscode-extension/package.json`:
- Add `"cursor"` to the `engines` field if supported
- Bump version to `2.0.0`
- Update description to mention both VS Code and Cursor support

---

### PART B — JetBrains Plugin skeleton

Create a new directory `jetbrains-plugin/` with the following files:

**`jetbrains-plugin/src/main/kotlin/com/cadence/CadencePlugin.kt`**:
```kotlin
// A JetBrains IDE plugin that sends heartbeats to cadence
// Uses the IntelliJ Platform Plugin SDK
```

Build a minimal Kotlin plugin with:
1. A `CadenceAppService` (application-level service) that:
   - Reads `apiKey` and `heartbeatUrl` from persistent settings
   - Sends a heartbeat every 2 minutes when the user is active
   - Heartbeat payload: `{ ide: "jetbrains", language, project, filename, timestamp }`
   - Uses `OkHttp` for HTTP calls
   - Detects current language from `FileType.getName()`
   - Detects project name from `Project.getName()`

2. A `CadenceSettings` (persistent state) storing `apiKey: String = ""` and `heartbeatUrl: String = ""`

3. A `CadenceConfigurable` (settings UI) showing two text fields: API Key and Heartbeat URL, with a "Test Connection" button

4. A `DocumentListener` that fires on document changes (typing/editing) to detect activity

**`jetbrains-plugin/src/main/resources/META-INF/plugin.xml`**:
```xml
<idea-plugin>
  <id>com.cadence.jetbrains</id>
  <name>Cadence</name>
  <version>1.0.0</version>
  <description>Track your JetBrains IDE coding activity with Cadence</description>
  <depends>com.intellij.modules.platform</depends>
  ...
</idea-plugin>
```

**`jetbrains-plugin/build.gradle.kts`**:
Standard IntelliJ platform plugin Gradle setup targeting IDE version 2023.1+.

---

### PART C — Zed Extension skeleton

Create `zed-extension/` with:

**`zed-extension/extension.toml`**:
```toml
id = "cadence"
name = "Cadence"
description = "Track your Zed coding activity"
version = "1.0.0"
schema_version = 1
authors = ["Cadence"]
[language_servers]
```

**`zed-extension/src/lib.rs`**:
Build a minimal Rust Zed extension that:
1. Reads config from Zed settings: `api_key` and `heartbeat_url`
2. On buffer save / buffer focus change, sends a heartbeat via HTTP POST
3. Payload: `{ ide: "zed", language, project, filename, timestamp }`
4. Uses a 2-minute debounce (don't send more than once per 2 min)
5. Uses Zed's `zed_extension_api` crate for workspace/buffer info

**`zed-extension/Cargo.toml`**:
```toml
[package]
name = "cadence-zed"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
zed_extension_api = "0.1"
```

---

### PART D — Neovim plugin skeleton

Create `neovim-plugin/` with:

**`neovim-plugin/lua/cadence/init.lua`**:
```lua
-- Cadence Neovim plugin
-- Sends heartbeats on BufEnter, CursorMoved, InsertEnter events
```

The plugin should:
1. Accept config: `require("cadence").setup({ api_key = "...", heartbeat_url = "..." })`
2. Register autocmds on `BufEnter`, `InsertEnter`, `CursorMovedI` events
3. Debounce heartbeats to max 1 per 2 minutes
4. Send heartbeat via `curl` (using `vim.fn.system` or `vim.loop` async)
5. Payload: `{ ide: "neovim", language: vim.bo.filetype, project: vim.fn.getcwd(), filename: vim.fn.expand('%:t'), timestamp: os.time() }`

**`neovim-plugin/README.md`**: Installation instructions for lazy.nvim, packer.nvim, and vim-plug.

---

## BONUS PROMPT — Public Profile Page (Optional Enhancement)

**Files to attach:** `app/` directory structure, updated analytics endpoint

---

Add a public profile page at `/u/[username]` for **cadence** that shows:

1. **URL**: `https://cadence.vercel.app/u/satwikchandra`
2. **No auth required** (public read)
3. **Shows**:
   - User avatar + username + "X hours coded"
   - Contribution graph (last 1 year, combined all IDEs)
   - Current streak + best streak
   - Top 3 languages
   - Top 3 projects
   - IDE badge row (shows which IDEs the user tracks)
   - "Built with cadence" link at bottom
4. **Privacy**: Only shown if the user enables "public profile" in Settings
5. **OG image**: Generate a dynamic OG image via `/api/og/[username]` using `@vercel/og` showing stats in a card format

Create:
- `app/u/[username]/page.tsx` — public profile page
- `app/api/og/[username]/route.tsx` — OG image generator
- `app/api/public/[username]/route.ts` — public data endpoint (no auth, respects privacy setting)
- Add `isPublic: Boolean @default(false)` to User model
- Add Settings UI toggle for "Make profile public"

Style the public profile page as a standalone branded page — same monochrome aesthetic but more "showcase" feel.

---

## Implementation Order

Feed these prompts to Codex in this sequence:

```
1 → Database schema (no UI changes, safe to run first)
2 → Backend APIs (depends on schema from 1)
3 → IdeSelector component (UI, no backend dependency)
4 → Dashboard updates (depends on 2 + 3)
5 → Setup page (depends on 2 + 3)
6 → Combined dashboard (depends on 2 + 4)
7 → Extensions (independent, run anytime)
Bonus → Public profile (independent, add last)
```

## Key Notes for Each Codex Session

- Always tell Codex: "This is a Next.js 16 + Tailwind CSS v4 + shadcn/ui + Framer Motion + Prisma app. Keep the existing monochrome (black/white/gray) editorial design aesthetic. Do not add color unless following the IDE brand color rules in `lib/ide-config.ts`."
- Remind Codex that Tailwind v4 uses CSS variables (`--color-*`) not the old `tailwind.config.js` approach
- All API routes use NextAuth session for auth — remind Codex to keep `getServerSession` calls
- Existing chart components are custom SVG or a light library — tell Codex to match the existing chart style before building new ones
======================================================================
ADDITIONAL PROMPT — Dark Mode, Typography Scale Reduction & App Rename
======================================================================

Files to attach:
  - app/dashboard/page.tsx (and all sub-components)
  - app/layout.tsx
  - app/globals.css (or equivalent Tailwind v4 CSS entry point)
  - components/ directory listing
  - tailwind.config.ts (if it exists)
  - Any existing theme/tokens file

----------------------------------------------------------------------
CONTEXT
----------------------------------------------------------------------

This is cadence — a Next.js 16 + Tailwind CSS v4 + shadcn/ui +
Framer Motion app that tracks VS Code/IDE coding activity. The current
design is a clean editorial monochrome (black/white/gray) with very
large serif display headings for every dashboard section.

The user wants three things done together in one pass:

  1. Dark mode — full system with a toggle, carefully tuned
     color tokens so the monochrome aesthetic holds in both modes.
  2. Typography scale reduction — the section headings and welcome
     text are currently too large; pull them down significantly while
     keeping the editorial serif personality.
  3. No layout or feature changes — only colors and font sizes change.

----------------------------------------------------------------------
PART A — COLOR TOKEN SYSTEM (Tailwind v4, CSS variables)
----------------------------------------------------------------------

In app/globals.css (the Tailwind v4 @layer base block), define all
colors as CSS custom properties. Do NOT use Tailwind's old
tailwind.config.js for colors; use var() tokens directly.

Replace any hardcoded color values throughout all components with
these variable names.

-- LIGHT MODE (default, :root) --

  --bg-base:          #F6F6F5   /* page background — warm off-white */
  --bg-card:          #EEEEEC   /* card/section backgrounds */
  --bg-card-hover:    #E6E6E4   /* card hover state */
  --bg-stat:          #E2E2E0   /* the gray stat blocks (LAST 7 DAYS etc) */
  --bg-input:         #FFFFFF
  --bg-nav:           #FFFFFF   /* top navbar background */

  --border:           #DEDEDC   /* default border */
  --border-strong:    #C4C4C2   /* stronger border, active states */

  --text-primary:     #0A0A0A
  --text-secondary:   #555552
  --text-muted:       #888884
  --text-disabled:    #BBBBBA
  --text-label:       #888884   /* small uppercase labels like TOTAL HOURS */

  --accent:           #0A0A0A   /* primary interactive color */
  --accent-fg:        #FFFFFF   /* text on accent background */
  --accent-muted:     #E2E2E0   /* muted/secondary buttons */

  /* Contribution graph cells — 5 levels */
  --contrib-0:        #E8E8E6   /* empty day */
  --contrib-1:        #C8C8C4   /* level 1 */
  --contrib-2:        #929290   /* level 2 */
  --contrib-3:        #484846   /* level 3 */
  --contrib-4:        #0A0A0A   /* level 4 — most active */

  /* Chart lines and bars */
  --chart-bar:        #0A0A0A
  --chart-bar-muted:  #D4D4D2
  --chart-line:       #0A0A0A
  --chart-grid:       #E8E8E6

  /* Background grid lines (the subtle grid on the page) */
  --grid-line:        rgba(0,0,0,0.05)

  /* Live dot */
  --live-dot:         #22C55E
  --connected-dot:    #22C55E

-- DARK MODE (.dark applied on <html>) --

  --bg-base:          #0D0D0D   /* near-black, not pure black */
  --bg-card:          #171717   /* cards — slightly lighter */
  --bg-card-hover:    #1F1F1F
  --bg-stat:          #1A1A1A   /* stat blocks */
  --bg-input:         #111111
  --bg-nav:           #0D0D0D

  --border:           #262626
  --border-strong:    #333333

  --text-primary:     #F0F0EE
  --text-secondary:   #9A9A96
  --text-muted:       #606060
  --text-disabled:    #333330
  --text-label:       #606060

  --accent:           #F0F0EE   /* inverted — light text is the accent */
  --accent-fg:        #0D0D0D
  --accent-muted:     #1F1F1F

  /* Contribution graph cells — dark mode inverts the intensity */
  --contrib-0:        #1A1A1A
  --contrib-1:        #2A2A28
  --contrib-2:        #555552
  --contrib-3:        #9A9A96
  --contrib-4:        #F0F0EE

  /* Charts */
  --chart-bar:        #F0F0EE
  --chart-bar-muted:  #2A2A2A
  --chart-line:       #F0F0EE
  --chart-grid:       #1F1F1F

  /* Grid */
  --grid-line:        rgba(255,255,255,0.04)

  /* Live dot */
  --live-dot:         #22C55E   /* keep green — it works in both modes */
  --connected-dot:    #22C55E

----------------------------------------------------------------------
How to apply tokens in Tailwind v4:

In globals.css:
  @layer base {
    :root { /* all light tokens above */ }
    .dark { /* all dark tokens above */ }
  }

In components, use inline style or @apply with var():
  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}

OR extend Tailwind v4 via @theme in globals.css:
  @theme {
    --color-bg-base: var(--bg-base);
    --color-bg-card: var(--bg-card);
    --color-text-primary: var(--text-primary);
    /* etc */
  }
Then use: bg-bg-card, text-text-primary in className strings.

----------------------------------------------------------------------
PART B — DARK MODE TOGGLE
----------------------------------------------------------------------

1. Create a custom React context: lib/theme-context.tsx

  - Stores: theme ('light' | 'dark' | 'system')
  - On mount, reads from localStorage key 'cadence-theme'
  - If 'system', uses window.matchMedia('prefers-color-scheme: dark')
  - Applies/removes 'dark' class on document.documentElement
  - Listens to system preference changes when mode is 'system'
  - Exports: useTheme() hook with { theme, setTheme, resolvedTheme }

2. Wrap app in ThemeProvider in app/layout.tsx

3. Create component: components/ThemeToggle.tsx

  A small toggle button placed in the top nav bar, to the LEFT of the
  notification bell icon (which is left of the avatar).

  DESIGN:
  - A single icon button (no text label)
  - Light mode: shows a Moon icon (Lucide Moon)
  - Dark mode: shows a Sun icon (Lucide Sun)
  - Size: same as the notification bell (approx 20px icon, w-8 h-8 button)
  - Style: no background by default, subtle hover:bg with border-radius
  - In light mode: hover background is var(--bg-card)
  - In dark mode: hover background is var(--bg-card)
  - Add a tooltip on hover: "Switch to dark mode" / "Switch to light mode"
  - Smooth icon swap with a 200ms fade/scale via Framer Motion

  DO NOT build a three-way system/light/dark toggle — keep it a simple
  binary toggle (light ↔ dark). System preference is only the initial
  default on first load.

4. Prevent flash of wrong theme (FOUC fix):
  Add an inline script in app/layout.tsx <head> (before any JS loads):

  <script dangerouslySetInnerHTML={{ __html: `
    (function() {
      try {
        var t = localStorage.getItem('cadence-theme');
        if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      } catch(e) {}
    })();
  `}} />

----------------------------------------------------------------------
PART C — TYPOGRAPHY SCALE REDUCTION
----------------------------------------------------------------------

The current dashboard uses extremely large serif display headings for
every section. These need to come down significantly. The editorial
personality should be preserved via font weight and spacing, not size.

CURRENT → TARGET sizes (use Tailwind size classes or equivalent px):

  Welcome back (the "Welcome back," line):
    Current:  ~text-5xl  (48px)
    Target:   text-xl    (20px), font-normal, text-(--text-secondary)
    Note: demote this to a greeting label, not a headline

  Username (the large "satwikchandra" display text):
    Current:  ~text-7xl  (72px), serif bold
    Target:   text-2xl   (24px), font-semibold, text-(--text-primary)
    Note: keep it on the same line as "Welcome back," — "Welcome back, satwikchandra"
          as a single line rather than stacked display text

  Section headings (Top Languages, Project Breakdown, Weekly Activity,
  30-Day Coding Trend, Language Mix, Daily Hours, Productivity Breakdown,
  Goals, Achievements, Contribution Graph):
    Current:  ~text-4xl  (36-40px), serif, with icon prefix
    Target:   text-base  (16px), font-semibold, tracking-tight,
              uppercase + letter-spacing: 0.05em — treat these as
              compact section labels, not display headlines
    Note: keep the icon prefix (the ~, ◉, ☆ etc.) but at 14px/text-sm
    Note: remove the oversized serif from section headings — use the
          body/sans font at semibold weight instead. The serif can stay
          for the welcome area username only.

  Stat card numbers (121 hours, 13d, 0 minutes, 16):
    Current:  ~text-4xl  (36px)
    Target:   text-2xl   (24px), font-bold
    Sub-labels (85 active days, Best: 34d):
    Keep at text-xs as-is.

  Card label tags (TOTAL HOURS, CURRENT STREAK, TODAY, LANGUAGES):
    Keep as-is — already small uppercase, correct.

  Session timer (968:28:07):
    Current:  very large mono clock
    Target:   text-3xl   (30px) — keep it prominent but not page-dominating

  LAST 7 DAYS / DAILY AVG / TODAY stat block numbers (3 hours 13 min):
    Current:  ~text-3xl
    Target:   text-xl    (20px), font-semibold

  Chart axis labels (Mon, Wed, Fri / dates / hour labels):
    Keep at text-xs — already fine.

  Contribution graph "85 active days in selected period":
    Keep at text-xs or text-sm — already fine.

  Nav brand "// cadence":
    Keep as-is — correct size for a nav logo.

----------------------------------------------------------------------
PART D — DARK MODE COMPONENT-SPECIFIC ADJUSTMENTS
----------------------------------------------------------------------

After applying the token system, check and fix these specific cases:

1. CONTRIBUTION GRAPH CELLS
   - In light mode: empty cells use --contrib-0 (#E8E8E6)
   - In dark mode: empty cells use --contrib-0 (#1A1A1A)
   - The 4 active intensity levels invert accordingly
   - The "Less ■ ■ ■ ■ More" legend at the bottom must also update
   - Tooltip on hover: bg-bg-card text-text-primary border-border

2. WEEKLY ACTIVITY BAR CHART (black bars)
   - Light mode: bars are black (#0A0A0A), track is #E2E2E0
   - Dark mode: bars are --chart-bar (#F0F0EE), track is --chart-bar-muted (#2A2A2A)

3. 30-DAY CODING TREND (line chart)
   - Light mode: line is black, grid lines are #E8E8E6
   - Dark mode: line is --chart-line (#F0F0EE), grid lines are --chart-grid (#1F1F1F)
   - The shaded area under the line: in dark mode use rgba(240,240,238,0.05)

4. LANGUAGE MIX DONUT CHART
   - The existing gray shades in light mode become inverted in dark:
     Darkest segment (most used): --contrib-4 color
     Lightest segment: --contrib-1 color
   - The legend dots should match segment colors

5. DAILY HOURS BAR CHART
   - Same as Weekly Activity — bars invert

6. PRODUCTIVITY RADAR CHART
   - In dark mode: the polygon fill becomes rgba(240,240,238,0.08)
   - Grid lines: --border (#262626)
   - Labels: --text-muted

7. API KEY CARD
   - Border: --border
   - Background: --bg-card
   - The copy/view icon buttons: color --text-muted, hover --text-primary

8. "Connected since" banner / session bar
   - Background: --bg-stat
   - Text: --text-secondary
   - The LIVE badge: keep green dot, text --text-primary

9. TOP NAV
   - Background: --bg-nav (white in light, near-black in dark)
   - Bottom border: --border
   - Active nav item underline: --text-primary (black/white)
   - Inactive nav items: --text-muted

10. PAGE BACKGROUND GRID LINES
    - The subtle grid of lines behind the page content:
      In dark mode use --grid-line: rgba(255,255,255,0.04)
      In light mode: rgba(0,0,0,0.05)
    - Implement as a CSS background-image on the main page wrapper:
      background-image: linear-gradient(var(--grid-line) 1px, transparent 1px),
                        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
      background-size: 40px 40px;

11. SHADCN/UI COMPONENTS (Dialog, Popover, Tooltip, etc.)
    - Update shadcn theme tokens to use the same CSS variables
    - Specifically ensure card, popover, tooltip all use --bg-card and --border

12. SCROLLBAR (custom scrollbar styling)
    - Light mode: thumb #C4C4C2, track transparent
    - Dark mode:  thumb #333333, track transparent
    Add to globals.css:
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }

----------------------------------------------------------------------
PART E — GOALS & ACHIEVEMENTS SECTION (dark mode specifics)
----------------------------------------------------------------------

  Goals progress bar:
    - Track: --bg-stat
    - Fill: --accent (black in light, white in dark)

  Achievement badge cards (the emoji badge grid):
    - Card background: --bg-card
    - Locked state: opacity-40 filter grayscale(1)
    - Unlocked state: full opacity, --border ring

  Rewards card (the "W" week badge):
    - Background: --bg-card
    - Border: --border

  Productivity Score circle:
    - The ring color: --accent
    - Score number: --text-primary

----------------------------------------------------------------------
PART F — IMPLEMENTATION CHECKLIST
----------------------------------------------------------------------

Apply changes in this order to avoid cascading issues:

  [ ] 1. Add CSS variables to globals.css (:root and .dark blocks)
  [ ] 2. Add FOUC-prevention script to layout.tsx <head>
  [ ] 3. Create lib/theme-context.tsx
  [ ] 4. Wrap app with ThemeProvider in layout.tsx
  [ ] 5. Build components/ThemeToggle.tsx
  [ ] 6. Add ThemeToggle to the nav bar (left of bell icon)
  [ ] 7. Replace all hardcoded colors in components with var() tokens
  [ ] 8. Apply typography scale changes (section by section per Part C)
  [ ] 9. Fix chart colors per Part D
  [ ] 10. Fix contribution graph per Part D item 1
  [ ] 11. Test both modes on all dashboard sections
  [ ] 12. Test FOUC prevention by hard-refreshing in each mode

----------------------------------------------------------------------
CRITICAL NOTES FOR CODEX
----------------------------------------------------------------------

- This is Tailwind CSS v4. There is NO tailwind.config.js color extension.
  All color customization goes through CSS custom properties in globals.css.
  Use @theme block to bridge CSS vars to Tailwind utility classes if needed.

- Do NOT change any layout, spacing (padding/margin), or border-radius values.
  Only colors and font sizes change.

- Do NOT change any API calls, state management, or data fetching logic.

- The toggle is binary (light/dark), not a three-way selector.

- Section heading changes: the headings should look like tight, compact
  section labels — think dashboard widget labels, not editorial magazine
  headlines. Keep the icon prefix but reduce it proportionally.

- Test the donut/line/bar charts carefully — these are the most likely
  to break in dark mode since they often use hardcoded fill colors.

# RESPONSIVENESS
- make everything responsive across mobiles,tablets and laptops

# NAME CHANGE
- change name of cadence to Cadence
- remove "//" from everywhere
- by reading this md file, add significant changes to landing page as per requirements.
- make sure to add antigravity as and IDE as well along with other IDE implementations.
- Good catch. Looking back at your very first image (the taskbar popup), Antigravity was listed right there alongside VS Code.
So the updated total is 7 IDEs:

VS Code — existing, updated
Cursor — VS Code fork, same extension with detection
JetBrains — covers all JB IDEs under one plugin
Zed — Rust extension
Neovim — Lua plugin
Sublime Text — Python package
Antigravity — needs research, not a widely known IDE in mainstream docs