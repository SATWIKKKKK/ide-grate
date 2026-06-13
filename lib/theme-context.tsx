"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "cadence-theme"

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.style.colorScheme = resolved
  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

  React.useLayoutEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
    setThemeState(nextTheme)
    setResolvedTheme(applyTheme(nextTheme))
  }, [])

  React.useEffect(() => {
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => setResolvedTheme(applyTheme("system"))
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [theme])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
    setResolvedTheme(applyTheme(nextTheme))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = React.useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}

export const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('${STORAGE_KEY}') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = stored === 'dark' || (stored === 'system' && prefersDark) ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {}
})();
`
