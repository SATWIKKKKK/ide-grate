import AppFooter from '@/components/AppFooter'
import Navbar from '@/components/Navbar'

const terms = [
  ['Use Cadence responsibly', 'Use the service for your own activity tracking or for workspaces where you have permission to install editor integrations.'],
  ['Keep credentials private', 'Your Cadence key identifies your account. Do not publish it, commit it, or share it in public issue trackers.'],
  ['Telemetry boundaries', 'Cadence is built for activity metadata. Do not modify integrations to send secrets, source code, or private file contents.'],
  ['Availability', 'Cadence may be unavailable during maintenance, deploys, provider outages, or local configuration problems.'],
  ['Account control', 'You can revoke keys, export data, delete activity, and change profile visibility from Settings.'],
]

export default function TermsPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="signal-container flex-1 py-16 sm:py-20">
        <section className="mx-auto max-w-3xl">
          <p className="signal-kicker">terms</p>
          <h1 className="mt-3 font-sans text-3xl font-semibold sm:text-5xl">Terms for using Cadence.</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            These terms describe the expected use of Cadence and its editor integrations. They are intentionally plain-language so the product boundary is easy to understand.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-4">
          {terms.map(([title, text]) => (
            <article key={title} className="app-card p-6">
              <h2 className="font-sans text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-4 max-w-5xl">
          <article className="app-card p-6">
            <h2 className="font-sans text-lg font-semibold">Changes</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cadence may update these terms as the product and integrations evolve. Continued use after updates means you accept the latest terms.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">Last updated: June 14, 2026</p>
          </article>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}
