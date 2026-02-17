# VS-Integrate - Track Your Real Coding Activity

A full-stack Next.js application that visualizes your VS Code coding activity with GitHub-style contribution graphs, streaks, and productivity insights.

## Features

- **GitHub-style Contribution Graph**: Real-time visualization of coding activity
- **Coding Streaks**: Track consecutive days of coding
- **Language Analytics**: Detailed breakdown of programming languages used
- **Productivity Insights**: Discover your most productive hours and days
- **VS Code Extension**: Automatic activity tracking with privacy focus
- **Privacy-First**: No code access, only anonymous activity metadata

## Tech Stack

### Frontend
- **Next.js 16** with React 19 and TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Lucide Icons** for visual elements

### Backend
- **Next.js API Routes** for serverless functions
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication (GitHub, Microsoft, or Dev mode)

### VS Code Extension
- **TypeScript** extension for activity tracking
- Heartbeat-based tracking with idle detection
- Privacy-focused (no code content sent)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local, Supabase, Neon, etc.)
- Git

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vsintegrate"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers (dev login available without these)
GITHUB_ID=""
GITHUB_SECRET=""
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

### VS Code Extension Setup

1. Build the extension:
```bash
cd vscode-extension
npm install
npm run compile
```

2. Install in VS Code:
   - Open VS Code
   - Press `F5` to launch Extension Development Host
   - Or package with: `npx @vscode/vsce package`

3. Configure:
   - Sign in to the dashboard and generate an API key
   - In VS Code: `Ctrl+Shift+P` → "VS Integrate: Set API Key"

## Project Structure

```
├── /app
│   ├── /api                 # Backend API routes
│   │   ├── /auth           # NextAuth authentication
│   │   ├── /apikey         # API key management
│   │   ├── /heartbeat      # VS Code extension endpoint
│   │   ├── /activities     # Activity logging
│   │   ├── /analytics      # Analytics endpoints
│   │   └── /contributions  # Contribution graph data
│   ├── /auth               # Auth pages (signin, error)
│   ├── /dashboard          # User dashboard
│   ├── page.jsx            # Landing page
│   └── layout.tsx          # Root layout
├── /components             # React components
├── /lib                    # Utilities and database
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Helper functions
├── /prisma
│   └── schema.prisma       # Database schema
└── /vscode-extension       # VS Code extension source
    ├── src/extension.ts    # Extension entry point
    └── package.json        # Extension manifest
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers

### API Key
- `GET /api/apikey` - Get current API key
- `POST /api/apikey` - Generate new API key
- `DELETE /api/apikey` - Revoke API key

### Heartbeat (VS Code Extension)
- `POST /api/heartbeat` - Receive heartbeat from extension
- `GET /api/heartbeat` - Check connection status

### Analytics
- `GET /api/analytics` - Get user analytics and stats

### Contributions
- `GET /api/contributions` - Get contribution graph data

### Activities
- `GET /api/activities` - Get activity history
- `POST /api/activities` - Log activity (manual)

## Database Schema

### User
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
```

### Activity
```prisma
model Activity {
  id         String   @id @default(cuid())
  userId     String
  startTime  DateTime
  endTime    DateTime
  duration   Int      // in seconds
  language   String?
  idleTime   Int      @default(0)
}
```

## Deployment

### Deploy to Vercel
```bash
npm run build
vercel deploy --prod
```

Set environment variables in Vercel Project Settings:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- OAuth credentials (optional)

### Database
- Use Supabase, Neon, or any PostgreSQL provider
- Run `npx prisma db push` to apply schema

## Development Mode

When no OAuth providers are configured, the app automatically enables a development login mode:
- Sign in with any email address
- No external OAuth required
- Perfect for local development and testing

To force dev login even with OAuth configured:
```env
ENABLE_DEV_LOGIN="true"
```

## Security Considerations

- All API endpoints require authentication
- API keys are securely generated with crypto
- Session management via NextAuth.js
- Use HTTPS in production
- Never expose secrets in frontend code

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ by developers who code at 2 AM.
