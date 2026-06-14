'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Layers3 } from 'lucide-react'
import { IDE_CONFIG, IDE_OPTIONS, type IdeSelection } from '@/lib/ide-config'
import IdeIcon from './IdeIcon'

type IdeStatus = {
  id: string
  active?: boolean
  connected?: boolean
  isSetup?: boolean
  hours?: number
}

type Props = {
  value: IdeSelection
  onChange: (value: IdeSelection) => void
  statuses?: IdeStatus[]
  includeCombined?: boolean
  compact?: boolean
}

export default function IdeSelector({ value, onChange, statuses = [], includeCombined = true, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeLabel = value === 'combined' ? 'Combined' : IDE_CONFIG[value].shortName

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const choose = (next: IdeSelection) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex max-w-[calc(100vw-1rem)] items-center gap-2 border border-border bg-card font-semibold text-foreground shadow-sm hover:border-primary hover:no-underline ${
          compact ? 'min-h-9 rounded-xl px-2.5 text-sm' : 'min-h-11 rounded-2xl px-3.5 text-sm'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value === 'combined' ? (
          <span className="inline-flex size-6 items-center justify-center rounded-lg bg-secondary text-primary">
            <Layers3 className="size-3.5" />
          </span>
        ) : (
          <IdeIcon ide={value} className="size-6" />
        )}
        <span className={compact ? 'sr-only' : 'truncate'}>{activeLabel}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-xl max-[380px]:right-1/2 max-[380px]:translate-x-1/2"
        >
          <div className="grid grid-cols-1 gap-1">
            {includeCombined && (
              <SelectorItem
                selected={value === 'combined'}
                label="Combined"
                active
                setup
                onClick={() => choose('combined')}
                leading={<span className="inline-flex size-8 items-center justify-center rounded-lg bg-secondary text-primary"><Layers3 className="size-4" /></span>}
              />
            )}
            {IDE_OPTIONS.map((definition) => {
              const status = statuses.find((item) => item.id === definition.id)
              return (
                <SelectorItem
                  key={definition.id}
                  selected={value === definition.id}
                  label={definition.shortName}
                  active={status?.active}
                  setup={status?.connected || status?.isSetup}
                  onClick={() => choose(definition.id)}
                  leading={<IdeIcon ide={definition.id} className="size-8" />}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SelectorItem({
  selected,
  label,
  active,
  setup,
  leading,
  onClick,
}: {
  selected: boolean
  label: string
  active?: boolean
  setup?: boolean
  leading: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={selected}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl p-2 text-left hover:bg-accent"
    >
      {leading}
      <span className="flex min-w-0 items-center gap-2">
        <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
        {setup && (
          <span
            className={`size-1.5 rounded-full ${active ? 'bg-[var(--color-live)]' : 'bg-[var(--color-contrib-3)]'}`}
            title={active ? 'Active now' : 'Connected'}
          />
        )}
      </span>
      {selected && <Check className="size-4 text-primary" />}
    </button>
  )
}
