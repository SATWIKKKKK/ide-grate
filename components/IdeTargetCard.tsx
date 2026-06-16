'use client'

import { AlertCircle, CheckCircle2, RadioTower } from 'lucide-react'
import IdeIcon from '@/components/IdeIcon'
import { IDE_CONFIG, type IdeId } from '@/lib/ide-config'

type IdeTargetCardProps = {
  ide: IdeId
  selected?: boolean
  active?: boolean
  connected?: boolean
  setup?: boolean
  metric?: string
  detail?: string
  onClick?: () => void
  className?: string
}

export default function IdeTargetCard({
  ide,
  selected = false,
  active = false,
  connected = false,
  setup = false,
  metric,
  detail,
  onClick,
  className = '',
}: IdeTargetCardProps) {
  const definition = IDE_CONFIG[ide]
  const isLive = active || connected
  const stateLabel = active ? 'Active now' : connected ? 'Verified' : setup ? 'Setup saved' : 'No heartbeat yet'
  const StateIcon = isLive ? CheckCircle2 : setup ? RadioTower : AlertCircle
  const content = (
    <>
      <div className="mb-3 flex w-full items-start justify-between gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background/90 shadow-sm">
          <IdeIcon ide={ide} className="size-8" />
        </span>
        <span
          className={`inline-flex max-w-[7rem] items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium leading-tight ${
            isLive
              ? 'bg-[var(--color-live-soft)] text-[var(--color-live)]'
              : setup
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground'
          }`}
        >
          <StateIcon className="size-3.5" />
          {stateLabel}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-sans text-base font-semibold">{definition.shortName}</h3>
        {metric ? (
          <p className="mt-2 font-mono text-xl font-semibold text-primary">{metric}</p>
        ) : null}
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{detail || definition.setupSummary}</p>
      </div>
    </>
  )

  const classes = `group relative min-h-[8.25rem] overflow-hidden rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-foreground/35 hover:bg-secondary/35 ${
    selected ? 'border-[#1d7cff] bg-[#1d7cff]/8 ring-1 ring-[#1d7cff]/25 dark:bg-[#1d7cff]/10' : 'border-border'
  } ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={selected} className={classes}>
        {content}
      </button>
    )
  }

  return (
    <div className={classes}>
      {content}
    </div>
  )
}
