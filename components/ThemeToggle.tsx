'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

const labels = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
} as const

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="inline-flex size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      aria-label={`${labels[theme]} active. Switch to ${labels[nextTheme].toLowerCase()}.`}
      title={`${labels[theme]} active`}
    >
      <Icon className="size-5" />
    </button>
  )
}
