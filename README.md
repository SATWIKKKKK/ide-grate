# CodeViz - Track Your Real Coding Activity

A premium landing page and API backend for a developer tool that visualizes real VS Code coding activity with contribution graphs, streaks, and productivity insights.

## Features

- **GitHub-style Contribution Graph**: Real-time visualization of coding activity
- **Coding Streaks**: Track consecutive days of coding without commits
- **Language Analytics**: Detailed breakdown of programming languages used
- **Productivity Insights**: Discover your most productive hours and days
- **Developer Stats**: Fun insights about your coding personality
- **Privacy-First**: No code access, only anonymous activity metadata

## Tech Stack

### Frontend
- **Next.js 16** with React and JavaScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Lucide Icons** for visual elements

### Backend
- **Node.js** with Next.js API routes
- **MongoDB** for data persistence
- **JWT** for authentication tokens

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB account (local or cloud)
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

3. Update `.env.local` with your MongoDB URI and other configuration:
```env
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/codeviz
JWT_SECRET=your-secret-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Project Structure

```
├── /app
│   ├── /api                 # Backend API routes
│   │   ├── /users          # User management endpoints
│   │   ├── /activities     # Activity logging endpoints
│   │   ├── /analytics      # Analytics calculation endpoints
│   │   └── /contributions  # Contribution graph endpoints
│   ├── page.jsx            # Main landing page
│   ├── layout.tsx          # Root layout with metadata
│   └── globals.css         # Global styles and theme
├── /components             # React components
│   ├── Navbar.jsx          # Navigation with auth
│   ├── Hero.jsx            # Hero section with CTAs
│   ├── Features.jsx        # Core features showcase
│   ├── Insights.jsx        # Intelligence section
│   ├── Privacy.jsx         # Privacy guarantee section
│   ├── Stats.jsx           # Fun stats with animations
│   ├── FinalCTA.jsx        # Final call-to-action
│   └── ContributionGraph.jsx # Visualization component
├── /context
│   └── AuthContext.jsx     # Authentication context and hooks
├── /lib
│   ├── auth.js             # Authentication utilities
│   ├── mongodb.js          # Database connection pooling
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## API Endpoints

### Users
- `POST /api/users` - Create or update user
- `GET /api/users?email=user@example.com` - Get user data

### Activities
- `POST /api/activities` - Log a coding session
- `GET /api/activities?email=user@example.com&days=30` - Get user activities

### Analytics
- `GET /api/analytics?email=user@example.com&days=30` - Get productivity insights

### Contributions
- `GET /api/contributions?email=user@example.com&range=year` - Get contribution graph data

## Authentication Flow

1. User clicks "Sign in with [Provider]"
2. OAuth redirect to GitHub, Microsoft, or VS Code
3. Provider verifies credentials and returns token
4. Backend creates/updates user in MongoDB
5. User data stored in browser localStorage with auth context

## Data Models

### User Document
```javascript
{
  _id: ObjectId,
  email: String,
  provider: String,
  name: String,
  createdAt: Date,
  updatedAt: Date,
  stats: {
    longestStreak: Number,
    totalHours: Number,
    topLanguages: Array,
    contributionData: Object
  }
}
```

### Activity Document
```javascript
{
  _id: ObjectId,
  email: String,
  userId: String,
  startTime: Date,
  endTime: Date,
  duration: Number,        // in minutes
  language: String,
  fileType: String,
  extensions: Array,
  idleTime: Number,
  createdAt: Date
}
```

## Deployment

### Deploy to Vercel
```bash
npm run build
vercel deploy
```

Set environment variables in Vercel Project Settings before deploying.

### Deploy MongoDB
- Use MongoDB Atlas (cloud) for production
- Ensure network access is configured properly
- Set connection string in environment variables

## Security Considerations

- All API endpoints should validate input
- Use HTTPS in production
- Implement rate limiting on API routes
- Never expose sensitive keys in frontend code
- Use environment variables for all secrets
- Implement proper CORS policies

## Performance Optimizations

- Images optimized with Next.js Image component
- API routes use connection pooling
- MongoDB queries are indexed
- Framer Motion animations use GPU acceleration
- Tailwind CSS is purged in production builds

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, issues, or feature requests, please open an issue on GitHub.

---

Built with ❤️ by developers who code at 2 AM.
