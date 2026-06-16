# Cadence

Cadence tracks real editor activity across your coding stack and turns heartbeats into dashboard stats, contribution graphs, streaks, language mix, public profiles, and embeddable widgets.

Cadence does not collect source code, file contents, keystrokes, or repository paths.

## Supported Editors

- VS Code
- Cursor
- Antigravity
- JetBrains IDEs
- Zed
- Neovim
- Sublime Text

## Features

- Multi-IDE heartbeat tracking with per-editor setup and verification
- Dashboard totals, streaks, contribution heatmap, language mix, project signals, and IDE breakdowns
- Separate combined activity page at `/dashboard/combined`
- Public profile pages at `/u/{username}` with privacy controls and per-IDE filtering
- Embeddable SVG widget at `/api/widget/{username}`
- Private setup flow with one Cadence API key for all editor targets
- Superadmin dashboard at `/superadmin`, protected by separate credentials

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4
- Prisma 7 with PostgreSQL
- NextAuth.js with credentials, GitHub OAuth, and Google OAuth
- Recharts for dashboard visualizations
- VSIX extension plus native/companion integrations for other editors

## Environment

Create `.env` or configure the same values in Vercel:

```env
DATABASE_URL="postgresql://user:password@host:5432/cadence?sslmode=require"
NEXTAUTH_SECRET="replace-with-a-long-secret"
NEXTAUTH_URL="https://ca-dence.vercel.app"

GITHUB_ID=""
GITHUB_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

SUPERADMIN_USERNAME="cadence-admin"
SUPERADMIN_PASSWORD="CadenceAdmin!2026"
SUPERADMIN_SESSION_SECRET="replace-with-another-long-secret"
```

`SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` are required in production. The test credentials above are only used automatically in local development when production env vars are missing.

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The app runs on `http://localhost:3001`.

## Editor Setup

1. Sign in.
2. Open `/dashboard/setup`.
3. Generate or copy your Cadence API key.
4. Pick the editor you use.
5. Follow the selected setup path: download/install, connect, and verify.
6. Use this heartbeat endpoint:

```text
https://ca-dence.vercel.app/api/heartbeat
```

The setup page includes copy buttons for API key, endpoint, editor commands, and verification commands.

## VS Code, Cursor, and Antigravity

Download the VSIX from:

```text
/api/download/vsix
```

Install it:

```bash
code --install-extension cadence.vsix
```

Cursor can use:

```bash
cursor --install-extension cadence.vsix
```

Then run:

```text
Cadence: Set API Key
Cadence: Test Connection
```

The extension reports VS Code, Cursor, or Antigravity based on the host editor.

## JetBrains

Build and install the plugin from `jetbrains-plugin`, then open:

```text
Settings > Tools > Cadence
```

Paste your API key and heartbeat endpoint, then run:

```text
Tools > Cadence > Test Connection
```

## Zed

Use the companion script:

```bash
python zed-extension\companion\cadence_zed_heartbeat.py --api-key "cad_your_key" --endpoint "https://ca-dence.vercel.app/api/heartbeat"
```

Verify:

```bash
python zed-extension\companion\cadence_zed_heartbeat.py --api-key "cad_your_key" --endpoint "https://ca-dence.vercel.app/api/heartbeat" --test
```

## Neovim

Copy `neovim-plugin/lua/cadence.lua` into your Neovim Lua runtime path and configure:

```lua
require("cadence").setup({
  api_key = "cad_your_key",
  endpoint = "https://ca-dence.vercel.app/api/heartbeat",
})
```

Verify:

```text
:CadenceTestConnection
```

## Sublime Text

Copy `sublime-package` into Sublime Text Packages as `Cadence`, then configure:

```json
{
  "api_key": "cad_your_key",
  "endpoint": "https://ca-dence.vercel.app/api/heartbeat"
}
```

Run:

```text
Command Palette > Cadence: Test Connection
```

## API Routes

- `POST /api/heartbeat` receives editor heartbeats.
- `GET /api/connection-status` checks selected editor connection state.
- `GET /api/ide-setup` returns all editor setup rows.
- `GET /api/stats/overview` returns dashboard stats.
- `GET /api/contributions` returns heatmap data.
- `GET /api/analytics/combined` returns all-IDE comparison data.
- `GET /api/public/{username}` returns public profile data.
- `GET /api/widget/{username}` returns the SVG widget.
- `GET /api/superadmin/users` returns protected admin user analytics.

## Public Profiles

Users can enable a public profile in Settings. Privacy toggles control whether visitors can see:

- bio
- total hours
- languages
- streaks
- heatmap
- project breakdowns

Public profile pages support per-IDE filtering from the profile dropdown.

## Superadmin

Open:

```text
/superadmin
```

Set these production env vars before using it on Vercel:

```env
SUPERADMIN_USERNAME="cadence-admin"
SUPERADMIN_PASSWORD="CadenceAdmin!2026"
SUPERADMIN_SESSION_SECRET="replace-with-another-long-secret"
```

The page is not linked from the main app and requires the superadmin login before user analytics are returned.

## Deployment

```bash
npm run build
vercel deploy --prod
```

After schema changes, apply migrations:

```bash
npx prisma migrate deploy
```

Set `NEXTAUTH_URL` to:

```text
https://ca-dence.vercel.app
```

Configure GitHub and Google OAuth callback URLs in their provider dashboards:

```text
https://ca-dence.vercel.app/api/auth/callback/github
https://ca-dence.vercel.app/api/auth/callback/google
```

## Security Notes

- API keys are generated server-side.
- Superadmin uses a signed HTTP-only cookie.
- Production superadmin access requires env credentials.
- Editor integrations send metadata only.
- Source code and file contents are never sent.
