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
  const guide = useMemo(() => buildGuide(ide), [ide])

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

      <div className="mb-4 rounded-lg border border-border bg-secondary/45 p-4">
        <h3 className="font-sans text-sm font-semibold">How to setup and use</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex gap-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card font-mono text-[10px] text-foreground">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
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
        >
          <ExternalLink className="size-4" />
          Download editor package
        </a>
      )}
    </section>
  )
}

function buildGuide(ide: IdeId) {
  if (ide === 'jetbrains') {
    return {
      summary: 'Install the JetBrains plugin, save your key and endpoint in Settings, then use the Tools menu test action.',
      steps: [
        'Build or install the Cadence JetBrains plugin in your JetBrains IDE.',
        'Open Settings or Preferences, search for Cadence, and paste your Cadence key plus heartbeat endpoint.',
        'Open a project and keep the IDE running so document activity can send debounced heartbeats.',
        'Run Tools > Cadence > Test Connection, then return here and verify the heartbeat.',
      ],
      verify: 'A successful JetBrains test records a heartbeat for JetBrains. If verification fails, check the key, endpoint, and whether the plugin is enabled.',
    }
  }
  if (ide === 'neovim') {
    return {
      summary: 'Load the Lua plugin, configure Cadence once, then use the Neovim test command.',
      steps: [
        'Copy the Cadence Lua plugin into your Neovim runtime path.',
        'Add the setup snippet to your init.lua or plugin manager config.',
        'Restart Neovim or reload your config, then open a real project buffer.',
        'Run :CadenceTestConnection, then return here and verify the heartbeat.',
      ],
      verify: 'A successful Neovim test records a heartbeat for Neovim. If verification fails, inspect :messages for API key or endpoint errors.',
    }
  }
  if (ide === 'sublime') {
    return {
      summary: 'Install the Sublime package, save package settings, then run the command palette test.',
      steps: [
        'Copy the Cadence package folder into Sublime Text Packages/Cadence.',
        'Open Preferences > Package Settings > Cadence and paste the settings JSON below.',
        'Open a file in a project so Sublime can report editor activity.',
        'Run Cadence: Test Connection from the command palette, then verify the heartbeat here.',
      ],
      verify: 'A successful Sublime test records a heartbeat for Sublime. If verification fails, confirm the package folder name and settings JSON.',
    }
  }
  if (ide === 'zed') {
    return {
      summary: 'Run the Zed companion process while editing because Zed does not expose reliable general telemetry hooks yet.',
      steps: [
        'Keep the Cadence Zed companion script available beside the Zed extension scaffold.',
        'Start the companion with your Cadence key and heartbeat endpoint.',
        'Keep the companion running while Zed is open and you edit project files.',
        'Run the companion test command, then return here and verify the heartbeat.',
      ],
      verify: 'A successful companion test records a heartbeat for Zed. If verification fails, check Python, network access, API key, and endpoint.',
    }
  }
  if (ide === 'cursor') {
    return {
      summary: 'Install the VS Code-family package in Cursor, save your key, and run the Cadence test command.',
      steps: [
        'Download the editor package from this page.',
        'In Cursor, open Extensions and choose Install from VSIX.',
        'Run Cadence: Set API Key from the command palette and paste your key plus endpoint.',
        'Run Cadence: Test Connection, then return here and verify the heartbeat.',
      ],
      verify: 'A successful Cursor test records a heartbeat for Cursor. If it appears under VS Code, reload Cursor after installing the package.',
    }
  }
  if (ide === 'antigravity') {
    return {
      summary: 'Install the VS Code-family package in Antigravity, save your key, and run the Cadence test command.',
      steps: [
        'Download the editor package from this page.',
        'In Antigravity, open the extensions view and install the VSIX package.',
        'Run Cadence: Set API Key and paste your key plus endpoint.',
        'Run Cadence: Test Connection, then return here and verify the heartbeat.',
      ],
      verify: 'A successful Antigravity test records a heartbeat for Antigravity. If verification fails, reload the editor and run the test again.',
    }
  }
  return {
    summary: 'Install the VS Code package, save your key, then run the Cadence test command.',
    steps: [
      'Download the editor package from this page.',
      'In VS Code, open Extensions and choose Install from VSIX.',
      'Run Cadence: Set API Key from the command palette and paste your key plus endpoint.',
      'Run Cadence: Test Connection, then return here and verify the heartbeat.',
    ],
    verify: 'A successful VS Code test records a heartbeat for VS Code. If verification fails, confirm the endpoint ends with /api/heartbeat.',
  }
}

function buildCommands(ide: IdeId, apiKey: string, endpoint: string) {
  const base = endpoint.startsWith('http') ? endpoint : `${typeof window !== 'undefined' ? window.location.origin : ''}${endpoint}`
  if (ide === 'jetbrains') {
    return [
      { id: 'jetbrains-build', label: 'Build plugin', value: `cd jetbrains-plugin\n./gradlew buildPlugin` },
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
    ? 'cursor --install-extension cadence.vsix'
    : ide === 'antigravity'
      ? 'Install from VSIX in the Antigravity extensions view'
      : 'code --install-extension cadence.vsix'
  return [
    { id: 'vsix-install', label: 'Install package', value: installCommand },
    { id: 'vsix-settings', label: 'Extension settings', value: `vsIntegrate.apiKey=${apiKey}\nvsIntegrate.apiEndpoint=${base}` },
    { id: 'vsix-test', label: 'Native test', value: 'Command Palette > Cadence: Test Connection' },
  ]
}
