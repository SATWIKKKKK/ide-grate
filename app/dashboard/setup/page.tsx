'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import IdeIcon from '@/components/IdeIcon'
import IdeTargetCard from '@/components/IdeTargetCard'
import { IDE_CONFIG, IDE_OPTIONS, isIdeId, type IdeId, type IdeSelection } from '@/lib/ide-config'
import { getIdeSetupGuide } from '@/lib/ide-setup-guides'

const CADENCE_HEARTBEAT_ENDPOINT = 'https://ca-dence.vercel.app/api/heartbeat'

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
  secret?: boolean
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
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const [verifyState, setVerifyState] = useState<VerifyState>(null)
  const [endpoint] = useState(CADENCE_HEARTBEAT_ENDPOINT)

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

  function toggleSecret(label: string) {
    setVisibleSecrets((current) => ({ ...current, [label]: !current[label] }))
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
          message: `Verified! Now you can start working on ${IDE_CONFIG[selectedIde].shortName}.`,
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

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 xl:p-8" data-gsap="fade-up">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="signal-kicker">Cadence key</p>
              <h2 className="mt-1 font-sans text-lg font-semibold">One key for all seven targets</h2>
            </div>
            <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-secondary/50 sm:flex-row sm:items-stretch lg:max-w-3xl">
              <code className="min-w-0 flex-1 truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                {apiKey ? formatSecret(apiKey, Boolean(visibleSecrets['api-key-top'])) : 'Generate an API key before connecting an editor'}
              </code>
              <div className="flex border-t border-border sm:border-l sm:border-t-0">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={() => toggleSecret('api-key-top')}
                    className="inline-flex min-h-11 items-center justify-center border-r border-border bg-card px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label={visibleSecrets['api-key-top'] ? 'Hide API key' : 'Show API key'}
                  >
                    {visibleSecrets['api-key-top'] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => copyText('api-key-top', apiKey || '')}
                  disabled={!apiKey}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border-r border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-45 sm:flex-none"
                >
                  {copied === 'api-key-top' ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Copy
                </button>
                <button
                  type="button"
                  onClick={generateKey}
                  disabled={generating}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-foreground px-4 text-sm font-medium text-background hover:opacity-85 disabled:opacity-60 sm:flex-none"
                >
                  {generating ? <RefreshCw className="size-4 animate-spin" /> : apiKey ? <RefreshCw className="size-4" /> : <KeyRound className="size-4" />}
                  {apiKey ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 border-b border-border pb-8 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
            {loading
              ? IDE_OPTIONS.map((definition) => (
                <div key={definition.id} className="min-h-[8.25rem] animate-pulse rounded-xl border border-border bg-secondary" />
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

          <div className="pt-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 shadow-sm">
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

            <div className="relative mt-8">
              <div className="absolute left-[8%] right-[8%] top-6 z-0 hidden border-t-2 border-border xl:block" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {setupFlow.map((step, index) => (
                  <SetupStepCard
                    key={`${selectedIde}-${step.title}`}
                    step={step}
                    index={index}
                    copied={copied}
                    verifyState={verifyState}
                    selectedIde={selectedIde}
                    alreadyVerified={Boolean(selectedRow?.isConnected)}
                    visibleSecrets={visibleSecrets}
                    onCopy={copyText}
                    onToggleSecret={toggleSecret}
                    onVerify={verifySelected}
                  />
                ))}
              </div>
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
  alreadyVerified,
  visibleSecrets,
  onCopy,
  onToggleSecret,
  onVerify,
}: {
  step: SetupFlowStep
  index: number
  copied: string | null
  verifyState: VerifyState
  selectedIde: IdeId
  alreadyVerified: boolean
  visibleSecrets: Record<string, boolean>
  onCopy: (label: string, value?: string) => void
  onToggleSecret: (label: string) => void
  onVerify: () => void
}) {
  const verified = alreadyVerified || (verifyState?.ide === selectedIde && verifyState.status === 'success')

  return (
    <div className="relative z-10 flex flex-col">
      <article className={`flex h-full min-h-[27rem] flex-col rounded-xl border bg-card p-6 shadow-sm transition-colors ${
        verified && index === 3 ? 'border-[var(--color-live)]/45 bg-[var(--color-live-soft)]/40' : 'border-border'
      }`}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-sm font-semibold text-background ring-4 ring-card">
            {index + 1}
          </span>
          <p className="signal-kicker">{step.eyebrow}</p>
        </div>
        <h3 className="font-sans text-lg font-semibold leading-snug">{step.title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>

        {step.fields?.length ? (
          <div className="mt-4 space-y-3">
            {step.fields.map((field) => (
              <div key={field.label} className="rounded-xl border border-border bg-secondary/45 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="signal-kicker">{field.label}</p>
                  <div className="flex items-center gap-1">
                    {field.secret ? (
                      <button
                        type="button"
                        onClick={() => onToggleSecret(field.label)}
                        disabled={field.disabled}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={visibleSecrets[field.label] ? `Hide ${field.label}` : `Show ${field.label}`}
                      >
                        {visibleSecrets[field.label] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    ) : null}
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
                </div>
                <code className="block break-all font-mono text-xs text-foreground/85">
                  {field.secret ? formatSecret(field.value, Boolean(visibleSecrets[field.label])) : field.value}
                </code>
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
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
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
                  disabled={verified || verifyState?.status === 'checking'}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60 ${
                    verified
                      ? 'bg-[var(--color-live)] text-white hover:opacity-90'
                      : 'bg-foreground text-background hover:opacity-85'
                  }`}
                >
                  {verifyState?.status === 'checking' ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {verified ? 'Verified' : action.label}
                </button>
              )
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onCopy(action.label, action.value)}
                disabled={action.disabled}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-45"
              >
                {copied === action.label ? <Check className="size-4" /> : <Copy className="size-4" />}
                {action.label}
              </button>
            )
          })}

          {index === 3 ? (
            <VerificationMessage verifyState={verifyState} selectedIde={selectedIde} alreadyVerified={alreadyVerified} />
          ) : null}
        </div>
      </article>
      {index < 3 ? <ArrowDown className="mx-auto my-2 size-5 text-muted-foreground md:hidden" /> : null}
    </div>
  )
}

function ConnectionStatus({ row, ide }: { row?: SetupRow; ide: IdeId }) {
  const connected = row?.isConnected
  const label = connected
    ? row?.isActiveNow
      ? 'Tracking now'
      : 'Tracking now'
    : row?.isSetup
      ? 'Setup saved'
      : 'Not active'

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${
      connected
        ? 'border-[var(--color-live)]/35 bg-[var(--color-live-soft)] text-[var(--color-live)]'
        : row?.isSetup
          ? 'border-border bg-secondary/55 text-muted-foreground'
          : 'border-destructive/30 bg-[var(--color-danger-soft)] text-destructive'
    }`}>
      <div className="flex items-center gap-2">
        {connected ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
        <span className="font-medium">{IDE_CONFIG[ide].shortName}: {label}</span>
      </div>
    </div>
  )
}

function VerificationMessage({ verifyState, selectedIde, alreadyVerified }: { verifyState: VerifyState; selectedIde: IdeId; alreadyVerified: boolean }) {
  if (alreadyVerified) {
    return (
      <div className="rounded-2xl border border-[var(--color-live)]/40 bg-[var(--color-live-soft)] p-3 text-xs leading-relaxed text-[var(--color-live)]">
        verified! now u can start working on {IDE_CONFIG[selectedIde].shortName}.
      </div>
    )
  }

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
  if (row?.isActiveNow) return 'Tracking now'
  if (row?.isConnected) return 'Tracking now'
  if (row?.weeklyMinutes) return `${Math.round(row.weeklyMinutes)} min this week`
  if (row?.isSetup) return 'Configured, waiting for test'
  return 'No heartbeat yet'
}

function formatSecret(value: string, visible: boolean): string {
  if (!value || value === 'Generate an API key first') return value
  if (visible) return value
  return `${value.slice(0, 8)}${'•'.repeat(18)}${value.slice(-6)}`
}

function buildSetupFlow(ide: IdeId, apiKey: string | null, endpoint: string): SetupFlowStep[] {
  const keyValue = apiKey || 'Generate an API key first'
  const hasKey = Boolean(apiKey)
  const definition = IDE_CONFIG[ide]
  const verifyCommand = getVerifyCommand(ide, keyValue, endpoint)
  const connectAction = getConnectAction(ide, keyValue, endpoint, hasKey)

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
      fields: getInstallFields(ide),
    },
    {
      eyebrow: 'Connect',
      title: 'Save the Cadence settings',
      detail: getConnectDetail(ide),
      fields: [
        { label: 'API key', value: keyValue, disabled: !hasKey, secret: hasKey },
        { label: 'Heartbeat endpoint', value: endpoint },
      ],
      actions: connectAction ? [connectAction] : [],
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
  if (isVsixIde(ide)) return 'Download the Cadence VSIX from this site. In VS Code, Go to Extensions > Install from VSIX.'
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
  if (ide === 'vscode') return 'Once the extension is installed, Generate an API Key & Go to VS Code & press Ctrl+Shift+P(Command Palette) and paste the open command(Cadence: Set API Key).'
  if (ide === 'cursor') return 'In Cursor, press Ctrl+Shift+P, install cadence.vsix from the command palette, then run the Cadence setup command.'
  if (ide === 'antigravity') return 'In Antigravity, open the command palette, install the Cadence VSIX, then run the Cadence setup command.'
  if (ide === 'jetbrains') return 'In JetBrains, open Settings with Ctrl+Alt+S, install the plugin ZIP from disk, restart, then open the Cadence tool settings.'
  if (ide === 'zed') return 'In Zed, keep the Cadence companion script available from your project terminal before you start the connection command.'
  if (ide === 'neovim') return 'In Neovim, copy cadence.lua into your Lua runtime path, then open your init.lua to add the setup snippet.'
  return 'In Sublime Text, copy the Cadence package folder into Packages, then open the Cadence package settings file.'
}

function getInstallFields(ide: IdeId): CopyField[] {
  if (isVsixIde(ide)) {
    return [
      { label: 'Command palette shortcut', value: 'Ctrl+Shift+P' },
      { label: 'Install command', value: 'Extensions: Install from VSIX' },
      { label: 'Open command', value: 'Cadence: Set API Key' },
    ]
  }
  if (ide === 'jetbrains') {
    return [
      { label: 'Settings shortcut', value: 'Ctrl+Alt+S' },
      { label: 'Install path', value: 'Settings > Plugins > Gear > Install Plugin from Disk' },
      { label: 'Open command', value: 'Settings > Tools > Cadence' },
    ]
  }
  if (ide === 'zed') {
    return [
      { label: 'Open terminal', value: 'Zed: Terminal > New Terminal' },
      { label: 'Companion script', value: 'python zed-extension\\companion\\cadence_zed_heartbeat.py --help' },
      { label: 'Open command', value: 'Run the companion while Zed is open' },
    ]
  }
  if (ide === 'neovim') {
    return [
      { label: 'Install command', value: 'mkdir -p ~/.config/nvim/lua && cp neovim-plugin/lua/cadence.lua ~/.config/nvim/lua/cadence.lua' },
      { label: 'Config file', value: '~/.config/nvim/init.lua' },
      { label: 'Open command', value: ':edit ~/.config/nvim/init.lua' },
    ]
  }
  return [
    { label: 'Package path', value: '%APPDATA%\\Sublime Text\\Packages\\Cadence' },
    { label: 'Settings path', value: 'Preferences > Package Settings > Cadence > Settings' },
    { label: 'Open command', value: 'Command Palette > Cadence: Test Connection' },
  ]
}

function getConnectDetail(ide: IdeId): string {
  if (isVsixIde(ide)) return 'After running Cadence: Set API Key, paste the API key first generated from the setup page, & then paste the heartbeat endpoint exactly as shown automatically and click on Enter. Tracking will start immediately.'
  if (ide === 'jetbrains') return 'Paste the API key and heartbeat endpoint into Settings > Tools > Cadence, then save.'
  if (ide === 'zed') return 'Copy and run the companion start command with your API key and heartbeat endpoint.'
  if (ide === 'neovim') return 'Copy the Lua setup snippet into init.lua, then restart Neovim or reload the file.'
  return 'Paste the settings JSON into the Cadence package settings file, then restart Sublime Text.'
}

function getConnectPayload(ide: IdeId, apiKey: string, endpoint: string): string {
  if (isVsixIde(ide)) return 'Cadence: Set API Key'
  if (ide === 'jetbrains') return `API key: ${apiKey}\nHeartbeat endpoint: ${endpoint}`
  if (ide === 'zed') {
    return `python zed-extension\\companion\\cadence_zed_heartbeat.py --api-key "${apiKey}" --endpoint "${endpoint}"`
  }
  if (ide === 'neovim') {
    return `require('cadence').setup({\n  api_key = '${apiKey}',\n  endpoint = '${endpoint}',\n})`
  }
  return `{\n  "api_key": "${apiKey}",\n  "endpoint": "${endpoint}"\n}`
}

function getConnectAction(ide: IdeId, apiKey: string, endpoint: string, hasKey: boolean): SetupAction | null {
  if (isVsixIde(ide)) return null
  if (ide === 'jetbrains') {
    return {
      label: 'Copy settings values',
      type: 'copy',
      value: getConnectPayload(ide, apiKey, endpoint),
      disabled: !hasKey,
    }
  }
  if (ide === 'zed') {
    return {
      label: 'Copy start command',
      type: 'copy',
      value: getConnectPayload(ide, apiKey, endpoint),
      disabled: !hasKey,
    }
  }
  if (ide === 'neovim') {
    return {
      label: 'Copy Lua setup',
      type: 'copy',
      value: getConnectPayload(ide, apiKey, endpoint),
      disabled: !hasKey,
    }
  }
  return {
    label: 'Copy settings JSON',
    type: 'copy',
    value: getConnectPayload(ide, apiKey, endpoint),
    disabled: !hasKey,
  }
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
