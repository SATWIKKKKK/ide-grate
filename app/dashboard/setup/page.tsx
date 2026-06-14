'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import IdeIcon from '@/components/IdeIcon'
import IdeSelector from '@/components/IdeSelector'
import IdeSetupPanel from '@/components/IdeSetupPanel'
import { IDE_CONFIG, IDE_OPTIONS, isIdeId, type IdeId, type IdeSelection } from '@/lib/ide-config'

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

export default function DashboardSetupPage() {
  const [selected, setSelected] = useState<IdeSelection>('vscode')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [rows, setRows] = useState<SetupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectionReady, setSelectionReady] = useState(false)
  const [verifyState, setVerifyState] = useState<{ ide: IdeId; status: 'idle' | 'checking' | 'success' | 'error'; message: string } | null>(null)

  const selectedIde = selected === 'combined' ? 'vscode' : selected
  const selectedRow = rows.find((row) => row.id === selectedIde)

  const statuses = useMemo(() => rows.map((row) => ({
    id: row.id,
    active: row.isActiveNow,
    connected: row.isConnected,
    isSetup: row.isSetup,
    hours: row.weeklyMinutes / 60,
  })), [rows])

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
          ? `No ${IDE_CONFIG[selectedIde].shortName} heartbeat yet. Run the editor test command below, then verify again.`
          : 'Generate a key before verifying an editor connection.',
      })
    } catch {
      setVerifyState({
        ide: selectedIde,
        status: 'error',
        message: 'Could not check connection status. Try again after the setup page reloads.',
      })
    }
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar toolbarSlot={<IdeSelector value={selected} onChange={setSelected} statuses={statuses} includeCombined={false} />} />

      <main className="dashboard-shell flex-1 space-y-5">
        <section className="signal-panel p-5 sm:p-6" data-gsap="fade-up">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="signal-kicker">Cadence setup</p>
              <h1 className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">Connect your editor stack</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                One Cadence key works across VS Code, Cursor, Antigravity, JetBrains, Zed, Neovim, and Sublime Text. Pick an editor, follow its setup path, run its test command, then verify the heartbeat here.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={generateKey}
                disabled={generating}
                className="signal-button min-h-10"
              >
                {generating ? <RefreshCw className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {apiKey ? 'Regenerate key' : 'Generate key'}
              </button>
              <Link href="/dashboard" className="signal-button signal-button-secondary min-h-10">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-border bg-secondary/65 p-3 font-mono text-xs text-muted-foreground break-all">
            {apiKey || 'Generate an API key to enable heartbeat clients.'}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="app-card p-5" data-gsap="fade-up">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="signal-kicker">Integrations</p>
                <h2 className="font-sans text-lg font-semibold">Seven first-class targets</h2>
              </div>
              <div className="sm:hidden">
                <IdeSelector value={selected} onChange={setSelected} statuses={statuses} includeCombined={false} />
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {IDE_OPTIONS.map((definition) => <div key={definition.id} className="h-28 animate-pulse rounded-md bg-secondary" />)}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {IDE_OPTIONS.map((definition) => {
                  const row = rows.find((item) => item.id === definition.id)
                  const active = row?.isConnected
                  const setup = row?.isSetup
                  return (
                    <button
                      key={definition.id}
                      type="button"
                      onClick={() => setSelected(definition.id)}
                      className={`rounded-md border p-4 text-left transition-colors hover:border-primary ${selectedIde === definition.id ? 'border-primary bg-background' : 'border-border bg-secondary/45'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <IdeIcon ide={definition.id} className="size-9" />
                        {active ? (
                          <CheckCircle2 className="size-5 text-[var(--color-live)]" />
                        ) : setup ? (
                          <span className="mt-1 size-2 rounded-full bg-muted-foreground" />
                        ) : (
                          <AlertCircle className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="mt-3 font-sans text-base font-semibold">{definition.shortName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row?.isActiveNow
                          ? 'Active now'
                          : row?.isConnected
                            ? 'Connection verified'
                            : row?.weeklyMinutes
                              ? `${Math.round(row.weeklyMinutes)} min this week`
                              : 'No heartbeat yet'}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="space-y-3" data-gsap="fade-up">
            <IdeSetupPanel ide={selectedIde} apiKey={apiKey} />
            <button
              type="button"
              onClick={verifySelected}
              disabled={verifyState?.status === 'checking'}
              className="signal-button w-full disabled:opacity-60"
            >
              {verifyState?.status === 'checking' ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Verify {IDE_CONFIG[selectedIde].shortName} connection
            </button>
            <div className={`rounded-md border p-3 text-xs ${
              verifyState?.ide === selectedIde && verifyState.status === 'success'
                ? 'border-[var(--color-live)]/40 bg-[var(--color-live-soft)] text-[var(--color-live)]'
                : verifyState?.ide === selectedIde && verifyState.status === 'error'
                  ? 'border-destructive/30 bg-[var(--color-danger-soft)] text-destructive'
                  : 'border-border bg-secondary/55 text-muted-foreground'
            }`}>
              {verifyState?.ide === selectedIde && verifyState.status !== 'idle'
                ? verifyState.message
                : selectedRow?.isConnected
                  ? `${IDE_CONFIG[selectedIde].shortName} has sent a verified heartbeat.`
                  : selectedRow?.isSetup
                    ? `Setup exists, but Cadence has not received a verified ${IDE_CONFIG[selectedIde].shortName} heartbeat yet.`
                    : `Follow the ${IDE_CONFIG[selectedIde].shortName} docs below, run the editor test command, then verify here.`}
            </div>
          </aside>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
