'use client'

import { useMemo, useState } from 'react'
import { Check, Clipboard, ExternalLink, Terminal } from 'lucide-react'
import { IDE_CONFIG, type IdeId } from '@/lib/ide-config'
import { getIdeSetupGuide } from '@/lib/ide-setup-guides'
import IdeIcon from './IdeIcon'

type Props = {
  ide: IdeId
  apiKey: string | null
  endpoint?: string
}

export default function IdeSetupPanel({ ide, apiKey, endpoint = '/api/heartbeat' }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const config = IDE_CONFIG[ide]
  const commands = useMemo(() => buildCommands(ide, apiKey || 'cad_your_api_key', endpoint), [ide, apiKey, endpoint])
  const guide = useMemo(() => getIdeSetupGuide(ide), [ide])

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
          <p className="signal-kicker">setup and verification</p>
          <h2 className="font-sans text-lg font-semibold">{config.shortName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{guide.summary}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-sans text-sm font-semibold">Commands and settings</h3>
        {commands.map((command) => (
          <div key={command.id} className="rounded-lg border border-border bg-secondary/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                <Terminal className="size-3.5" />
                {command.label}
              </span>
              <button
                type="button"
                onClick={() => copy(command.value, command.id)}
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-background"
                aria-label={`Copy ${command.label}`}
                title={`Copy ${command.label}`}
              >
                {copied === command.id ? <Check className="size-4" /> : <Clipboard className="size-4" />}
              </button>
            </div>
            <code className="block overflow-x-auto whitespace-pre rounded-lg bg-background p-3 font-mono text-xs text-foreground">
              {command.value}
            </code>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Test connection and verify</p>
        <p className="mt-1">{guide.verify}</p>
      </div>

      {['vscode', 'cursor', 'antigravity'].includes(ide) && (
        <a
          href="/api/download/vsix"
          className="signal-button signal-button-secondary mt-5 w-full"
          download="cadence.vsix"
        >
          <ExternalLink className="size-4" />
          Download cadence.vsix
        </a>
      )}
    </section>
  )
}

function buildCommands(ide: IdeId, apiKey: string, endpoint: string) {
  const base = endpoint.startsWith('http') ? endpoint : `${typeof window !== 'undefined' ? window.location.origin : ''}${endpoint}`
  if (ide === 'jetbrains') {
    return [
      { id: 'jetbrains-build', label: 'Build plugin', value: `cd jetbrains-plugin\ngradle buildPlugin` },
      { id: 'jetbrains-key', label: 'Settings values', value: `API key: ${apiKey}\nEndpoint: ${base}` },
      { id: 'jetbrains-test', label: 'Native test', value: 'Tools > Cadence > Test Connection' },
    ]
  }
  if (ide === 'neovim') {
    return [
      { id: 'neovim-install', label: 'Plugin file', value: `cp neovim-plugin/lua/cadence.lua ~/.config/nvim/lua/cadence.lua` },
      { id: 'neovim-lua', label: 'Lua config', value: `require('cadence').setup({ api_key = '${apiKey}', endpoint = '${base}' })` },
      { id: 'neovim-test', label: 'Native test', value: ':CadenceTestConnection' },
    ]
  }
  if (ide === 'sublime') {
    return [
      { id: 'sublime-install', label: 'Package path', value: `copy sublime-package "%APPDATA%\\Sublime Text\\Packages\\Cadence"` },
      { id: 'sublime-settings', label: 'Package settings', value: `{\n  "api_key": "${apiKey}",\n  "endpoint": "${base}"\n}` },
      { id: 'sublime-test', label: 'Native test', value: 'Command Palette > Cadence: Test Connection' },
    ]
  }
  if (ide === 'zed') {
    return [
      { id: 'zed-cli', label: 'Companion', value: `python zed-extension/companion/cadence_zed_heartbeat.py --api-key ${apiKey} --endpoint ${base}` },
      { id: 'zed-test', label: 'Companion test', value: `python zed-extension/companion/cadence_zed_heartbeat.py --api-key ${apiKey} --endpoint ${base} --test` },
    ]
  }
  const installCommand = ide === 'cursor'
    ? 'cursor --install-extension ./cadence.vsix'
    : ide === 'antigravity'
      ? 'Extensions view > Install from VSIX > cadence.vsix'
      : 'code --install-extension ./cadence.vsix'
  return [
    { id: 'vsix-install', label: 'Install package', value: installCommand },
    { id: 'vsix-settings', label: 'Extension settings', value: `cadence.apiKey=${apiKey}\ncadence.apiEndpoint=${base}` },
    { id: 'vsix-test', label: 'Native test', value: 'Command Palette > Cadence: Test Connection' },
  ]
}
