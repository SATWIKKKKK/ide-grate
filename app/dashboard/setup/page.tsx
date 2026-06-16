'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ImageIcon,
  KeyRound,
  RefreshCw,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import IdeIcon from '@/components/IdeIcon'
import IdeTargetCard from '@/components/IdeTargetCard'
import { IDE_CONFIG, IDE_OPTIONS, isIdeId, type IdeId, type IdeSelection } from '@/lib/ide-config'
import { getIdeSetupGuide } from '@/lib/ide-setup-guides'

type SetupRow = {
  id: IdeId
  shortName: string
  name: string
  color: string
  isSetup: boolean
  isConnected: boolean
  isActiveNow?: boolean
  lastHeartbeat: string | null
  lastSessionAt: string | null
  weeklyMinutes: number
  hasApiKey: boolean
}

type CopyField = {
  label: string
  value: string
  disabled?: boolean
}

type SetupAction = {
  label: string
  type: 'copy' | 'download' | 'verify'
  value?: string
  href?: string
  download?: string
  disabled?: boolean
}

type SetupFlowStep = {
  title: string
  eyebrow: string
  detail: string
  fields?: CopyField[]
  actions?: SetupAction[]
  placeholder?: {
    title: string
    detail: string
  }
}

type VerifyState = {
  ide: IdeId
  status: 'idle' | 'checking' | 'success' | 'error'
  message: string
} | null

export default function DashboardSetupPage() {
  const [selected, setSelected] = useState<IdeSelection>('vscode')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [rows, setRows] = useState<SetupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectionReady, setSelectionReady] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [verifyState, setVerifyState] = useState<VerifyState>(null)
  const [endpoint, setEndpoint] = useState('https://cadence.vercel.app/api/heartbeat')

  const selectedIde = selected === 'combined' ? 'vscode' : selected
  const selectedRow = rows.find((row) => row.id === selectedIde)
  const selectedGuide = useMemo(() => getIdeSetupGuide(selectedIde), [selectedIde])
  const setupFlow = useMemo(
    () => buildSetupFlow(selectedIde, apiKey, endpoint),
    [selectedIde, apiKey, endpoint],
  )

  async function fetchSetup() {
    const res = await fetch('/api/ide-setup', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load setup')
    const data = await res.json()
    setApiKey(data.apiKey)
    setRows(data.integrations)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    setEndpoint(`${window.location.origin}/api/heartbeat`)
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('ide')
    const stored = window.localStorage.getItem('cadence-selected-ide')
    const next = isIdeId(fromUrl) ? fromUrl : isIdeId(stored) ? stored : 'vscode'
    setSelected(next)
    setSelectionReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !selectionReady || selected === 'combined') return
    window.localStorage.setItem('cadence-selected-ide', selected)
    const url = new URL(window.location.href)
    url.searchParams.set('ide', selected)
    window.history.replaceState(null, '', url)
  }, [selected, selectionReady])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        await fetchSetup()
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const interval = window.setInterval(() => {
      fetchSetup().catch(() => {})
    }, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  async function copyText(label: string, value?: string) {
    if (!value || typeof navigator === 'undefined') return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1400)
  }

  async function generateKey() {
    setGenerating(true)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
        await fetchSetup()
      }
    } finally {
      setGenerating(false)
    }
  }

  async function verifySelected() {
    setVerifyState({ ide: selectedIde, status: 'checking', message: `Checking for a ${IDE_CONFIG[selectedIde].shortName} heartbeat...` })
    try {
      const res = await fetch(`/api/connection-status?ide=${selectedIde}`, { cache: 'no-store' })
      const data = await res.json()
      await fetchSetup()
      if (res.ok && data.connected) {
        setVerifyState({
          ide: selectedIde,
          status: 'success',
          message: `${IDE_CONFIG[selectedIde].shortName} is verified. A heartbeat reached Cadence.`,
        })
        return
      }
      setVerifyState({
        ide: selectedIde,
        status: 'error',
        message: apiKey
          ? `No ${IDE_CONFIG[selectedIde].shortName} heartbeat yet. Run the editor test command, then verify again.`
          : 'Generate a key before verifying an editor connection.',
      })
    } catch {
      setVerifyState({
        ide: selectedIde,
        status: 'error',
        message: 'Could not check connection status. Reload the setup page and try again.',
      })
    }
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />

      <main className="setup-shell flex-1 space-y-5">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-gsap="fade-up">
          <div>
            <p className="signal-kicker">Setup and verification</p>
            <h1 className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">Connect Cadence to every editor you use</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Pick an editor, copy the values inside its setup path, run the native test command, then verify the heartbeat here.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm sm:p-5 xl:p-6" data-gsap="fade-up">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="signal-kicker">Cadence key</p>
              <h2 className="mt-1 font-sans text-lg font-semibold">One key for all seven targets</h2>
            </div>
            <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-background/75 p-2 sm:flex-row sm:items-center lg:max-w-3xl">
              <code className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
                {apiKey || 'Generate an API key before connecting an editor'}
              </code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyText('api-key-top', apiKey || '')}
                  disabled={!apiKey}
                  className="signal-button signal-button-secondary min-h-10 px-3 disabled:opacity-45"
                >
                  {copied === 'api-key-top' ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Copy
                </button>
                <button
                  type="button"
                  onClick={generateKey}
                  disabled={generating}
                  className="signal-button min-h-10 px-3"
                >
                  {generating ? <RefreshCw className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                  {apiKey ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
            {loading
              ? IDE_OPTIONS.map((definition) => (
                <div key={definition.id} className="min-h-[8.25rem] animate-pulse rounded-2xl border border-border bg-secondary" />
              ))
              : IDE_OPTIONS.map((definition) => {
                const row = rows.find((item) => item.id === definition.id)
                return (
                  <IdeTargetCard
                    key={definition.id}
                    ide={definition.id}
                    selected={selectedIde === definition.id}
                    active={row?.isActiveNow}
                    connected={row?.isConnected}
                    setup={row?.isSetup}
                    detail={targetDetail(row)}
                    onClick={() => {
                      setSelected(definition.id)
                      setVerifyState(null)
                    }}
                  />
                )
              })}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/80">
                  <IdeIcon ide={selectedIde} className="size-10" />
                </span>
                <div className="min-w-0">
                  <p className="signal-kicker">Selected path</p>
                  <h2 className="mt-1 font-sans text-2xl font-semibold">{IDE_CONFIG[selectedIde].shortName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{selectedGuide.summary}</p>
                </div>
              </div>
              <ConnectionStatus row={selectedRow} ide={selectedIde} />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              {setupFlow.map((step, index) => (
                <SetupStepCard
                  key={`${selectedIde}-${step.title}`}
                  step={step}
                  index={index}
                  copied={copied}
                  verifyState={verifyState}
                  selectedIde={selectedIde}
                  onCopy={copyText}
                  onVerify={verifySelected}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}

function SetupStepCard({
  step,
  index,
  copied,
  verifyState,
  selectedIde,
  onCopy,
  onVerify,
}: {
  step: SetupFlowStep
  index: number
  copied: string | null
  verifyState: VerifyState
  selectedIde: IdeId
  onCopy: (label: string, value?: string) => void
  onVerify: () => void
}) {
  return (
    <div className="relative">
      {index < 3 && (
        <>
          <ArrowRight className="absolute -right-3 top-8 z-10 hidden size-6 text-primary/70 xl:block" />
          <ArrowDown className="mx-auto mb-1 size-5 text-primary/70 xl:hidden" />
        </>
      )}
      <article className="flex h-full min-h-[24rem] flex-col rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-sm font-semibold text-background">
            {index + 1}
          </span>
          <div>
            <p className="signal-kicker">{step.eyebrow}</p>
            <h3 className="mt-1 font-sans text-lg font-semibold">{step.title}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>

        {step.placeholder ? (
          <div className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/55 p-4 text-center">
            <ImageIcon className="size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{step.placeholder.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.placeholder.detail}</p>
          </div>
        ) : null}

        {step.fields?.length ? (
          <div className="mt-4 space-y-3">
            {step.fields.map((field) => (
              <div key={field.label} className="rounded-2xl border border-border bg-secondary/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="signal-kicker">{field.label}</p>
                  <button
                    type="button"
                    onClick={() => onCopy(field.label, field.value)}
                    disabled={field.disabled}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Copy ${field.label}`}
                  >
                    {copied === field.label ? <Check className="size-4 text-[var(--color-live)]" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <code className="block break-all font-mono text-xs text-foreground/85">{field.value}</code>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-auto space-y-2 pt-4">
          {step.actions?.map((action) => {
            if (action.type === 'download') {
              return (
                <a
                  key={action.label}
                  href={action.href}
                  download={action.download}
                  className="signal-button signal-button-secondary min-h-10 w-full justify-center text-sm"
                >
                  <Download className="size-4" />
                  {action.label}
                </a>
              )
            }

            if (action.type === 'verify') {
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={onVerify}
                  disabled={verifyState?.status === 'checking'}
                  className="signal-button min-h-10 w-full justify-center text-sm disabled:opacity-60"
                >
                  {verifyState?.status === 'checking' ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {action.label}
                </button>
              )
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onCopy(action.label, action.value)}
                disabled={action.disabled}
                className="signal-button signal-button-secondary min-h-10 w-full justify-center text-sm disabled:opacity-45"
              >
                {copied === action.label ? <Check className="size-4" /> : <Copy className="size-4" />}
                {action.label}
              </button>
            )
          })}

          {index === 3 ? (
            <VerificationMessage verifyState={verifyState} selectedIde={selectedIde} />
          ) : null}
        </div>
      </article>
    </div>
  )
}

function ConnectionStatus({ row, ide }: { row?: SetupRow; ide: IdeId }) {
  const connected = row?.isConnected
  const label = connected
    ? row?.isActiveNow
      ? 'Active now'
      : 'Verified'
    : row?.isSetup
      ? 'Setup saved'
      : 'Needs setup'

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${
      connected
        ? 'border-[var(--color-live)]/35 bg-[var(--color-live-soft)] text-[var(--color-live)]'
        : 'border-border bg-secondary/55 text-muted-foreground'
    }`}>
      <div className="flex items-center gap-2">
        {connected ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
        <span className="font-medium">{IDE_CONFIG[ide].shortName}: {label}</span>
      </div>
    </div>
  )
}

function VerificationMessage({ verifyState, selectedIde }: { verifyState: VerifyState; selectedIde: IdeId }) {
  const isCurrent = verifyState?.ide === selectedIde
  if (!isCurrent || verifyState.status === 'idle') {
    return (
      <div className="rounded-2xl border border-border bg-secondary/55 p-3 text-xs leading-relaxed text-muted-foreground">
        Run the editor test command first, then verify the heartbeat here.
      </div>
    )
  }

  const success = verifyState.status === 'success'
  const checking = verifyState.status === 'checking'
  return (
    <div className={`rounded-2xl border p-3 text-xs leading-relaxed ${
      success
        ? 'border-[var(--color-live)]/40 bg-[var(--color-live-soft)] text-[var(--color-live)]'
        : checking
          ? 'border-border bg-secondary/55 text-muted-foreground'
          : 'border-destructive/30 bg-[var(--color-danger-soft)] text-destructive'
    }`}>
      {verifyState.message}
    </div>
  )
}

function targetDetail(row?: SetupRow): string {
  if (row?.isActiveNow) return 'Sending heartbeats now'
  if (row?.isConnected) return 'Connection verified'
  if (row?.weeklyMinutes) return `${Math.round(row.weeklyMinutes)} min this week`
  if (row?.isSetup) return 'Configured, waiting for test'
  return 'No heartbeat yet'
}

function buildSetupFlow(ide: IdeId, apiKey: string | null, endpoint: string): SetupFlowStep[] {
  const keyValue = apiKey || 'Generate an API key first'
  const hasKey = Boolean(apiKey)
  const definition = IDE_CONFIG[ide]
  const commandName = getCommandName(ide)
  const verifyCommand = getVerifyCommand(ide, keyValue, endpoint)

  return [
    {
      eyebrow: 'Download',
      title: getDownloadTitle(ide),
      detail: getDownloadDetail(ide),
      actions: getDownloadActions(ide),
    },
    {
      eyebrow: 'Install',
      title: `Install in ${definition.shortName}`,
      detail: getInstallDetail(ide),
      placeholder: {
        title: `${definition.shortName} install screenshot`,
        detail: 'Drop the install screenshot here when the final walkthrough images are ready.',
      },
      actions: getInstallActions(ide),
    },
    {
      eyebrow: 'Connect',
      title: 'Save the Cadence settings',
      detail: getConnectDetail(ide),
      fields: [
        { label: 'API key', value: keyValue, disabled: !hasKey },
        { label: 'Heartbeat endpoint', value: endpoint },
        { label: 'Open command', value: commandName },
      ],
      actions: [
        {
          label: getConnectActionLabel(ide),
          type: 'copy',
          value: getConnectPayload(ide, keyValue, endpoint),
          disabled: !hasKey,
        },
      ],
    },
    {
      eyebrow: 'Verify',
      title: `Verify ${definition.shortName} connection`,
      detail: getIdeSetupGuide(ide).verify,
      fields: [
        { label: 'Test command', value: verifyCommand, disabled: !hasKey },
      ],
      actions: [
        { label: 'Copy test command', type: 'copy', value: verifyCommand, disabled: !hasKey },
        { label: `Verify ${definition.shortName} connection`, type: 'verify' },
      ],
    },
  ]
}

function getDownloadTitle(ide: IdeId): string {
  if (isVsixIde(ide)) return 'Download cadence.vsix'
  if (ide === 'jetbrains') return 'Build the plugin package'
  if (ide === 'zed') return 'Prepare the companion'
  if (ide === 'neovim') return 'Copy the Lua plugin'
  return 'Copy the package folder'
}

function getDownloadDetail(ide: IdeId): string {
  if (isVsixIde(ide)) return 'Use the Cadence VSIX from this site. Keep it somewhere easy to find before opening the editor installer.'
  if (ide === 'jetbrains') return 'Build the local JetBrains plugin ZIP from the repo, then install it from disk.'
  if (ide === 'zed') return 'Zed uses the Cadence companion script while native extension telemetry remains limited.'
  if (ide === 'neovim') return 'Place cadence.lua in your Neovim Lua runtime path before adding setup code.'
  return 'Install the Cadence package folder into Sublime Text Packages.'
}

function getDownloadActions(ide: IdeId): SetupAction[] {
  if (isVsixIde(ide)) {
    const installCommand = ide === 'cursor'
      ? 'cursor --install-extension cadence.vsix'
      : 'code --install-extension cadence.vsix'
    const cleanupCommand = ide === 'cursor'
      ? 'cursor --uninstall-extension vsintegrate.vs-integrate-tracker'
      : 'code --uninstall-extension vsintegrate.vs-integrate-tracker'

    return [
      { label: 'Download cadence.vsix', type: 'download', href: '/api/download/vsix', download: 'cadence.vsix' },
      { label: 'Copy install command', type: 'copy', value: installCommand },
      { label: 'Copy old extension cleanup', type: 'copy', value: cleanupCommand },
    ]
  }

  if (ide === 'jetbrains') {
    return [{ label: 'Copy build command', type: 'copy', value: 'cd jetbrains-plugin\ngradle buildPlugin' }]
  }
  if (ide === 'zed') {
    return [{ label: 'Copy companion help command', type: 'copy', value: 'python zed-extension\\companion\\cadence_zed_heartbeat.py --help' }]
  }
  if (ide === 'neovim') {
    return [{ label: 'Copy plugin install command', type: 'copy', value: 'mkdir -p ~/.config/nvim/lua && cp neovim-plugin/lua/cadence.lua ~/.config/nvim/lua/cadence.lua' }]
  }
  return [{ label: 'Copy package install command', type: 'copy', value: 'xcopy /E /I sublime-package "%APPDATA%\\Sublime Text\\Packages\\Cadence"' }]
}

function getInstallDetail(ide: IdeId): string {
  if (ide === 'vscode') return 'Open Extensions, choose Install from VSIX, select cadence.vsix, then reload VS Code if prompted.'
  if (ide === 'cursor') return 'Open Cursor Extensions, choose Install from VSIX, select cadence.vsix, then reload Cursor.'
  if (ide === 'antigravity') return 'Open Antigravity Extensions and install the same Cadence VSIX package.'
  if (ide === 'jetbrains') return 'Open Settings > Plugins, install the generated ZIP from disk, then restart the IDE.'
  if (ide === 'zed') return 'Keep the companion command running beside Zed while editing a project.'
  if (ide === 'neovim') return 'Restart Neovim after the Lua file is on your runtime path.'
  return 'Restart Sublime Text after the package folder is in place.'
}

function getInstallActions(ide: IdeId): SetupAction[] {
  if (isVsixIde(ide)) {
    return [{ label: 'Copy install menu path', type: 'copy', value: 'Extensions > ... > Install from VSIX > cadence.vsix' }]
  }
  if (ide === 'jetbrains') {
    return [{ label: 'Copy install menu path', type: 'copy', value: 'Settings > Plugins > Install Plugin from Disk' }]
  }
  if (ide === 'zed') {
    return [{ label: 'Copy run note', type: 'copy', value: 'Run the Cadence companion while Zed is open.' }]
  }
  if (ide === 'neovim') {
    return [{ label: 'Copy reload command', type: 'copy', value: ':luafile %' }]
  }
  return [{ label: 'Copy package path', type: 'copy', value: '%APPDATA%\\Sublime Text\\Packages\\Cadence' }]
}

function getConnectDetail(ide: IdeId): string {
  if (isVsixIde(ide)) return 'Run the command palette action, paste the API key, then paste the endpoint exactly as shown.'
  if (ide === 'jetbrains') return 'Open Cadence settings and paste the API key plus heartbeat endpoint.'
  if (ide === 'zed') return 'Start the companion with the API key and endpoint arguments.'
  if (ide === 'neovim') return 'Paste the Lua setup snippet into your Neovim config.'
  return 'Paste the settings JSON into the Cadence package settings file.'
}

function getCommandName(ide: IdeId): string {
  if (isVsixIde(ide)) return 'Cadence: Set API Key'
  if (ide === 'jetbrains') return 'Settings > Tools > Cadence'
  if (ide === 'zed') return 'python zed-extension\\companion\\cadence_zed_heartbeat.py'
  if (ide === 'neovim') return "require('cadence').setup(...)"
  return 'Preferences > Package Settings > Cadence > Settings'
}

function getConnectActionLabel(ide: IdeId): string {
  if (isVsixIde(ide)) return 'Copy command name'
  if (ide === 'jetbrains') return 'Copy settings path'
  if (ide === 'zed') return 'Copy start command'
  if (ide === 'neovim') return 'Copy Lua setup'
  return 'Copy settings JSON'
}

function getConnectPayload(ide: IdeId, apiKey: string, endpoint: string): string {
  if (isVsixIde(ide)) return 'Cadence: Set API Key'
  if (ide === 'jetbrains') return 'Settings > Tools > Cadence'
  if (ide === 'zed') {
    return `python zed-extension\\companion\\cadence_zed_heartbeat.py --api-key "${apiKey}" --endpoint "${endpoint}"`
  }
  if (ide === 'neovim') {
    return `require('cadence').setup({\n  api_key = '${apiKey}',\n  api_endpoint = '${endpoint}',\n})`
  }
  return `{\n  "api_key": "${apiKey}",\n  "api_endpoint": "${endpoint}"\n}`
}

function getVerifyCommand(ide: IdeId, apiKey: string, endpoint: string): string {
  if (isVsixIde(ide)) return 'Cadence: Test Connection'
  if (ide === 'jetbrains') return 'Tools > Cadence > Test Connection'
  if (ide === 'zed') return `python zed-extension\\companion\\cadence_zed_heartbeat.py --api-key "${apiKey}" --endpoint "${endpoint}" --test`
  if (ide === 'neovim') return ':CadenceTestConnection'
  return 'Command Palette > Cadence: Test Connection'
}

function isVsixIde(ide: IdeId) {
  return ide === 'vscode' || ide === 'cursor' || ide === 'antigravity'
}
