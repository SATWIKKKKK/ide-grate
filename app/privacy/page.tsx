import AppFooter from '@/components/AppFooter'
import Navbar from '@/components/Navbar'

const collected = [
  'Account details such as name, email, avatar, and sign-in provider.',
  'Editor activity metadata: time, language, IDE, platform, idle state, and anonymized project hash.',
  'Optional public profile settings, goals, achievements, and notification preferences.',
]

const notCollected = [
  'Source code or file contents.',
  'Keystrokes, terminal output, secrets, or clipboard contents.',
  'Raw project paths unless you explicitly opt in to public project naming.',
]

export default function PrivacyPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="signal-container flex-1 py-16 sm:py-20">
        <section className="mx-auto max-w-3xl">
          <p className="signal-kicker">privacy</p>
          <h1 className="mt-3 font-sans text-3xl font-semibold sm:text-5xl">Metadata only. Your code stays yours.</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Cadence tracks coding activity so you can understand focus time, language mix, streaks, and daily progress. It is designed around metadata, not source inspection.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-2">
          <article className="app-card p-6">
            <h2 className="font-sans text-lg font-semibold">What Cadence collects</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {collected.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="app-card p-6">
            <h2 className="font-sans text-lg font-semibold">What Cadence does not collect</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {notCollected.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </section>

        <section className="mx-auto mt-4 max-w-5xl">
          <article className="app-card p-6">
            <h2 className="font-sans text-lg font-semibold">Controls</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              You can keep your profile private, choose which stats appear publicly, export your activity data, or delete activity records from Settings. Revoking your Cadence key stops editor integrations from sending new heartbeats.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">Last updated: June 14, 2026</p>
          </article>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}
