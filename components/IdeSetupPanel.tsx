'use client'

import { useMemo, useState } from 'react'
import { Check, Clipboard, ExternalLink, Terminal } from 'lucide-react'
import { IDE_CONFIG, type IdeId } from '@/lib/ide-config'
import IdeIcon from './IdeIcon'

type Props = {
  ide: IdeId
  apiKey: string | null
  endpoint?: string
}

export default function IdeSetupPanel({ ide, apiKey, endpoint = '/api/heartbeat' }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const config = IDE_CONFIG[ide]
  const commands = useMemo(() => buildCommands(ide, apiKey || 'vsi_your_api_key', endpoint), [ide, apiKey, endpoint])

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    setCopied(id)
    window.setTimeout(() => setCopied(null), 1400)
  }

  return (
    <section className="app-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <IdeIcon ide={ide} className="size-10" />
        <div className="min-w-0">
          <p className="signal-kicker">{config.statusLabel}</p>
          <h2 className="font-sans text-lg font-semibold">{config.setupTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{config.setupSummary}</p>
        </div>
      </div>

      <div className="space-y-3">
        {commands.map((command) => (
          <div key={command.id} className="rounded-md border border-border bg-secondary/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                <Terminal className="size-3.5" />
                {command.label}
              </span>
              <button
                type="button"
                onClick={() => copy(command.value, command.id)}
                className="inline-flex size-8 items-center justify-center rounded-sm hover:bg-background"
                aria-label={`Copy ${command.label}`}
                title={`Copy ${command.label}`}
              >
                {copied === command.id ? <Check className="size-4" /> : <Clipboard className="size-4" />}
              </button>
            </div>
            <code className="block overflow-x-auto whitespace-pre rounded-sm bg-background p-3 font-mono text-xs text-foreground">
              {command.value}
            </code>
          </div>
        ))}
      </div>

      {ide === 'zed' && (
        <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
          Zed support uses the companion CLI path because the current extension model does not expose reliable general buffer-save telemetry hooks.
        </div>
      )}

      <a
        href="/api/download/vsix"
        className="signal-button signal-button-secondary mt-5 w-full"
      >
        <ExternalLink className="size-4" />
        Download extension package
      </a>
    </section>
  )
}

function buildCommands(ide: IdeId, apiKey: string, endpoint: string) {
  const base = endpoint.startsWith('http') ? endpoint : `${typeof window !== 'undefined' ? window.location.origin : ''}${endpoint}`
  if (ide === 'jetbrains') {
    return [
      { id: 'jetbrains-key', label: 'Plugin setting', value: `CADENCE_API_KEY=${apiKey}\nCADENCE_ENDPOINT=${base}` },
      { id: 'jetbrains-test', label: 'Connection test', value: 'Tools > Cadence > Test Connection' },
    ]
  }
  if (ide === 'neovim') {
    return [
      { id: 'neovim-lua', label: 'Lua config', value: `require('cadence').setup({ api_key = '${apiKey}', endpoint = '${base}' })` },
      { id: 'neovim-test', label: 'Connection test', value: ':CadenceTestConnection' },
    ]
  }
  if (ide === 'sublime') {
    return [
      { id: 'sublime-settings', label: 'Package settings', value: `{\n  "api_key": "${apiKey}",\n  "endpoint": "${base}"\n}` },
      { id: 'sublime-test', label: 'Connection test', value: 'Tools > Cadence > Test Connection' },
    ]
  }
  if (ide === 'zed') {
    return [
      { id: 'zed-cli', label: 'Companion CLI', value: `cadence-zed --api-key ${apiKey} --endpoint ${base}` },
      { id: 'zed-settings', label: 'Zed task', value: `cadence_zed_heartbeat --api-key ${apiKey} --endpoint ${base}` },
    ]
  }
  return [
    { id: 'vsix-install', label: 'Install VSIX', value: `code --install-extension cadence.vsix` },
    { id: 'vsix-settings', label: 'Extension settings', value: `vs-integrate.apiKey=${apiKey}\nvs-integrate.endpoint=${base}` },
  ]
}
