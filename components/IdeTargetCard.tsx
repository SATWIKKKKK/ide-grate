'use client'

import type { CSSProperties } from 'react'
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
  const stateLabel = active ? 'Active now' : connected ? 'Connected' : setup ? 'Setup saved' : 'No heartbeat yet'
  const StateIcon = isLive ? CheckCircle2 : setup ? RadioTower : AlertCircle
  const style = { '--ide-color': definition.color } as CSSProperties
  const content = (
    <>
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: definition.color }} />
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background/85 shadow-sm">
          <IdeIcon ide={ide} className="size-8" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${
            isLive
              ? 'border-[var(--color-live)]/35 bg-[var(--color-live-soft)] text-[var(--color-live)]'
              : setup
                ? 'border-border bg-secondary text-muted-foreground'
                : 'border-border bg-background/70 text-muted-foreground'
          }`}
        >
          <StateIcon className="size-3.5" />
          {stateLabel}
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <h3 className="truncate font-sans text-base font-semibold">{definition.shortName}</h3>
        {metric ? (
          <p className="mt-2 font-mono text-xl font-semibold text-primary">{metric}</p>
        ) : null}
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{detail || definition.setupSummary}</p>
      </div>
    </>
  )

  const classes = `group relative min-h-[8.25rem] overflow-hidden rounded-2xl border bg-card/80 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/35 hover:shadow-md ${
    selected ? 'border-foreground/80 shadow-md ring-2 ring-foreground/10' : 'border-border'
  } ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={selected} style={style} className={classes}>
        {content}
      </button>
    )
  }

  return (
    <div style={style} className={classes}>
      {content}
    </div>
  )
}
