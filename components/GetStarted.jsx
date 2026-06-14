'use client'

import { useState } from 'react'
import { Check, Copy, Download, Key, Settings } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy} className="absolute right-2 top-2 rounded-md border border-border bg-background p-2 hover:border-primary" title="Copy to clipboard">
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4 text-muted-foreground" />}
    </button>
  )
}

function InstallTabs() {
  const siteUrl = ''

  return (
    <div className="space-y-3">
      <a href={`${siteUrl}/api/download/vsix`} download="cadence.vsix" className="signal-button w-full">
        <Download className="size-4" />
        Download cadence.vsix
      </a>
      <div className="space-y-2">
        {[
          'Open VS Code, Cursor, or Antigravity extensions.',
          'Choose Install from VSIX from the menu.',
          'Select the downloaded cadence.vsix file.',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-background/65 p-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-[10px] font-semibold text-primary">{i + 1}</span>
            <span className="text-xs text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GetStarted() {
  const steps = [
    {
      icon: Download,
      title: 'Install an editor integration',
      description: 'Use the VSIX for VS Code-family editors or a native plugin for your editor.',
      custom: 'install-tabs',
    },
    {
      icon: Key,
      title: 'Generate and set API key',
      description: 'Sign in, generate an API key, and save it through the Cadence setup path.',
      commands: [
        'Open Dashboard -> Setup',
        'Paste your API key',
        'Endpoint: /api/heartbeat',
      ],
    },
    {
      icon: Settings,
      title: 'Start coding',
      description: 'Open any file in a connected editor. The dashboard updates as heartbeats arrive.',
      commands: [],
    },
  ]

  return (
    <section className="border-t border-border bg-background/70 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12" data-gsap="fade-up">
          <p className="signal-kicker">setup</p>
          <h2 className="mt-3 text-3xl sm:text-5xl">Get started without ceremony.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Install an editor integration and start tracking activity in minutes.</p>
        </div>

        <div className="space-y-4" data-gsap-stagger>
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="app-card grid gap-5 p-5 sm:grid-cols-[4rem_1fr]" data-gsap-item>
                <div className="flex size-12 items-center justify-center rounded-md bg-foreground text-background">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-semibold">{index + 1}. {step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                  <div className="mt-4">
                    {step.custom === 'install-tabs' && <InstallTabs />}
                    {step.commands && step.commands.length > 0 && (
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md border border-border bg-secondary p-4 text-sm">
                          <code className="text-muted-foreground">{step.commands.join('\n')}</code>
                        </pre>
                        <CopyButton text={step.commands.join('\n')} />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
