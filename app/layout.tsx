import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import GsapMotion from '@/components/motion/GsapMotion'
import { themeInitScript } from '@/lib/theme-context'
import './globals.css'

export const metadata = {
  title: 'Cadence - Track Real Coding Activity',
  description: 'Visualize real editor activity across VS Code, Cursor, Antigravity, JetBrains, Zed, Neovim, and Sublime Text.',
  generator: 'Next.js',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&family=Libre+Caslon+Text:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ThemeProvider>
            <GsapMotion />
            {children}
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
