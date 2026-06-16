'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { BarChart3, Lock, LogOut, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

type AdminUser = {
  id: string
  name: string | null
  email: string | null
  username: string | null
  image: string | null
  profilePublic: boolean
  createdAt: string
  totalHours: number
  totalSessions: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  ideSetups: { ide: string; isActive: boolean; lastHeartbeat: string | null }[]
  ideBreakdown: { ide: string; hours: number; sessions: number }[]
  languageBreakdown: { language: string; hours: number }[]
}

type AdminPayload = {
  totals: { users: number; hours: number; sessions: number; publicProfiles: number }
  users: AdminUser[]
}

export default function SuperadminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [payload, setPayload] = useState<AdminPayload | null>(null)
  const [query, setQuery] = useState('')

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/users', { cache: 'no-store' })
      if (res.status === 401) {
        setPayload(null)
        return
      }
      if (res.ok) setPayload(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function login(event: FormEvent) {
    event.preventDefault()
    setError('')
    setAuthLoading(true)
    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid credentials')
        return
      }
      await loadUsers()
    } finally {
      setAuthLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/superadmin/logout', { method: 'POST' })
    setPayload(null)
    setUsername('')
    setPassword('')
  }

  const users = useMemo(() => {
    const list = payload?.users || []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((user) =>
      [user.name, user.email, user.username].some((value) => value?.toLowerCase().includes(q))
    )
  }, [payload?.users, query])

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-4 text-foreground">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Lock className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="font-sans text-xl font-semibold">Superadmin</h1>
                <p className="text-sm text-muted-foreground">Restricted Cadence access</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          {error && <p className="mb-3 rounded-lg border border-destructive/30 bg-[var(--color-danger-soft)] p-2 text-sm text-destructive">{error}</p>}
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" autoComplete="username" />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary" autoComplete="current-password" />
            </label>
          </div>
          <button disabled={authLoading} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">
            {authLoading ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page-shell min-h-screen text-foreground">
      <header className="border-b border-border bg-[var(--color-paper-glass)] backdrop-blur-xl">
        <div className="signal-container flex items-center justify-between py-4">
          <div>
            <p className="signal-kicker">Cadence superadmin</p>
            <h1 className="mt-1 font-sans text-xl font-semibold">Users and activity</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={loadUsers} className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Refresh">
              <RefreshCw className="size-4" />
            </button>
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="signal-container py-8">
        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat icon={<Users className="size-4" />} label="Users" value={`${payload.totals.users}`} />
          <AdminStat icon={<BarChart3 className="size-4" />} label="Hours" value={`${payload.totals.hours}h`} />
          <AdminStat icon={<BarChart3 className="size-4" />} label="Sessions" value={`${payload.totals.sessions}`} />
          <AdminStat icon={<ShieldCheck className="size-4" />} label="Public profiles" value={`${payload.totals.publicProfiles}`} />
        </section>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." className="h-11 flex-1 bg-transparent text-sm outline-none" />
        </div>

        <section className="space-y-3">
          {users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="size-12 overflow-hidden rounded-xl border border-border bg-secondary">
                    {user.image ? <img src={user.image} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center font-semibold">{(user.name || user.email || '?')[0]}</div>}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-sans text-base font-semibold">{user.name || user.email || 'Unnamed user'}</h2>
                    <p className="truncate text-sm text-muted-foreground">{user.email || 'No email'} {user.username ? `· /u/${user.username}` : ''}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()} · Last active {user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleString() : 'never'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5 lg:min-w-[32rem]">
                  <MiniMetric label="Hours" value={`${user.totalHours}h`} />
                  <MiniMetric label="Sessions" value={`${user.totalSessions}`} />
                  <MiniMetric label="Days" value={`${user.activeDays}`} />
                  <MiniMetric label="Current" value={`${user.currentStreak}d`} />
                  <MiniMetric label="Best" value={`${user.longestStreak}d`} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-secondary/35 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">IDE usage</p>
                  <div className="flex flex-wrap gap-2">
                    {user.ideBreakdown.length ? user.ideBreakdown.map((ide) => (
                      <span key={ide.ide} className="rounded-full border border-border bg-card px-2 py-1 text-xs">
                        {ide.ide}: {ide.hours}h / {ide.sessions}s
                      </span>
                    )) : <span className="text-xs text-muted-foreground">No IDE usage yet</span>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/35 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Top languages</p>
                  <div className="flex flex-wrap gap-2">
                    {user.languageBreakdown.length ? user.languageBreakdown.map((language) => (
                      <span key={language.language} className="rounded-full border border-border bg-card px-2 py-1 text-xs">
                        {language.language}: {language.hours}h
                      </span>
                    )) : <span className="text-xs text-muted-foreground">No language data yet</span>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

function AdminStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="font-sans text-2xl font-semibold">{value}</p>
    </article>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
