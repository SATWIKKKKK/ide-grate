'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock, Flame, Loader2, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import IdeIcon from '@/components/IdeIcon'
import { IDE_CONFIG, type IdeId } from '@/lib/ide-config'

type IdeMetric = {
  id: IdeId
  name: string
  color: string
  hours: number
  sessions: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  connected: boolean
  active: boolean
  percentage: number
}

type CombinedData = {
  totalHours: number
  activeDays: number
  ideBreakdown: IdeMetric[]
  mostUsed: IdeMetric | null
  leastUsed: IdeMetric | null
}

function formatHours(hours: number) {
  if (hours <= 0) return '0m'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`
}

export default function CombinedDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<CombinedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/analytics/combined', { cache: 'no-store' })
        if (res.ok && active) setData(await res.json())
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [session?.user])

  const chartData = useMemo(() => data?.ideBreakdown || [], [data])

  if (status === 'loading' || loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          Loading combined activity...
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="page-shell flex min-h-screen flex-col text-foreground">
      <Navbar />
      <main className="dashboard-shell flex-1 py-14 sm:py-16">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="signal-kicker">Combined tracking activity</p>
            <h1 className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">Every editor, one activity view</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Compare where your coding time lands across Cadence-supported editors.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="ml-2 font-semibold text-primary">{formatHours(data?.totalHours || 0)}</span>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard icon={<Clock className="size-4" />} label="Combined hours" value={formatHours(data?.totalHours || 0)} />
          <SummaryCard icon={<CalendarDays className="size-4" />} label="Active days" value={`${data?.activeDays || 0}`} />
          <SummaryCard icon={<Trophy className="size-4" />} label="Most used" value={data?.mostUsed ? data.mostUsed.name : 'No data'} />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="app-card p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="font-sans text-lg font-semibold">IDE usage graph</h2>
              <p className="mt-1 text-sm text-muted-foreground">Total hours by editor.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--color-rule)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10 }} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="app-card p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="font-sans text-lg font-semibold">Share of time</h2>
              <p className="mt-1 text-sm text-muted-foreground">Most and least used editors.</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.filter((item) => item.hours > 0)} dataKey="hours" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                    {chartData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-secondary/45 p-3">
                <p className="text-xs text-muted-foreground">Most used</p>
                <p className="mt-1 font-semibold">{data?.mostUsed?.name || 'No data'}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/45 p-3">
                <p className="text-xs text-muted-foreground">Least used</p>
                <p className="mt-1 font-semibold">{data?.leastUsed?.name || 'No data'}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.ideBreakdown || []).map((ide) => (
            <article key={ide.id} className="app-card min-h-[10rem] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <IdeIcon ide={ide.id} className="size-12" />
                <span className={`rounded-full px-2 py-1 text-xs ${ide.active ? 'bg-[var(--color-live-soft)] text-[var(--color-live)]' : ide.connected ? 'bg-secondary text-muted-foreground' : 'bg-[var(--color-danger-soft)] text-destructive'}`}>
                  {ide.active ? 'Tracking now' : ide.connected ? 'Verified' : 'Not active'}
                </span>
              </div>
              <h3 className="font-sans text-base font-semibold">{IDE_CONFIG[ide.id].shortName}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Hours" value={formatHours(ide.hours)} />
                <Metric label="Sessions" value={`${ide.sessions}`} />
                <Metric label="Days" value={`${ide.activeDays}`} />
                <Metric label="Streak" value={`${ide.currentStreak}d`} icon={<Flame className="size-3" />} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Best streak: {ide.longestStreak}d · {ide.percentage}% of total</p>
            </article>
          ))}
        </section>
      </main>
      <AppFooter />
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="app-card p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-sans text-2xl font-semibold">{value}</p>
    </article>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  )
}
