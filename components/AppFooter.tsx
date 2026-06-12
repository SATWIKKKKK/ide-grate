import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="signal-container flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <p className="font-mono text-xs text-muted-foreground">© 2024 vs-integrate. Built for precision.</p>
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link href="/#privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/#privacy" className="hover:text-foreground">Terms</Link>
          <Link href="/api/heartbeat" className="hover:text-foreground">API</Link>
          <Link href="/onboarding" className="hover:text-foreground">Support</Link>
        </nav>
      </div>
    </footer>
  )
}
