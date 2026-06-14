export const IDE_IDS = [
  "vscode",
  "cursor",
  "antigravity",
  "jetbrains",
  "zed",
  "neovim",
  "sublime",
] as const

export type IdeId = (typeof IDE_IDS)[number]
export type IdeSelection = IdeId | "combined"

export type IdeDefinition = {
  id: IdeId
  name: string
  shortName: string
  label: string
  family: "vscode" | "native" | "companion"
  color: string
  setupTitle: string
  setupSummary: string
}

export const IDE_CONFIG: Record<IdeId, IdeDefinition> = {
  vscode: {
    id: "vscode",
    name: "Visual Studio Code",
    shortName: "VS Code",
    label: "VS Code",
    family: "vscode",
    color: "#007ACC",
    setupTitle: "VS Code extension",
    setupSummary: "Install the Cadence VSIX, paste your API key, then run the connection test.",
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    shortName: "Cursor",
    label: "Cursor",
    family: "vscode",
    color: "#111111",
    setupTitle: "Cursor extension",
    setupSummary: "Install the same Cadence VSIX in Cursor. Runtime detection reports it separately.",
  },
  antigravity: {
    id: "antigravity",
    name: "Google Antigravity",
    shortName: "Antigravity",
    label: "Antigravity",
    family: "vscode",
    color: "#4285F4",
    setupTitle: "Antigravity extension",
    setupSummary: "Use the Cadence VSIX in Antigravity's editor view; appName detection marks it as Antigravity.",
  },
  jetbrains: {
    id: "jetbrains",
    name: "JetBrains IDEs",
    shortName: "JetBrains",
    label: "JetBrains",
    family: "native",
    color: "#FE315D",
    setupTitle: "JetBrains plugin",
    setupSummary: "Build or install the Cadence plugin, set your API key, and test the heartbeat client.",
  },
  zed: {
    id: "zed",
    name: "Zed",
    shortName: "Zed",
    label: "Zed",
    family: "companion",
    color: "#084CCF",
    setupTitle: "Zed companion",
    setupSummary: "Use the documented companion CLI while Zed extensions lack reliable buffer-save telemetry hooks.",
  },
  neovim: {
    id: "neovim",
    name: "Neovim",
    shortName: "Neovim",
    label: "Neovim",
    family: "native",
    color: "#57A143",
    setupTitle: "Neovim plugin",
    setupSummary: "Load the Lua plugin, configure your API key, then let debounced buffer events send heartbeats.",
  },
  sublime: {
    id: "sublime",
    name: "Sublime Text",
    shortName: "Sublime",
    label: "Sublime",
    family: "native",
    color: "#FF9800",
    setupTitle: "Sublime Text package",
    setupSummary: "Install the package, set your API key, and use the test connection command.",
  },
}

export const IDE_OPTIONS = IDE_IDS.map((id) => IDE_CONFIG[id])

export function isIdeId(value: unknown): value is IdeId {
  return typeof value === "string" && IDE_IDS.includes(value.toLowerCase() as IdeId)
}

export function normalizeIde(value: unknown, fallback: IdeId = "vscode"): IdeId {
  if (!value) return fallback
  const candidate = String(value).toLowerCase()
  return isIdeId(candidate) ? candidate : fallback
}

export function getIdeName(value: unknown): string {
  const ide = normalizeIde(value)
  return IDE_CONFIG[ide].shortName
}

export function parseIdeParam(value: string | null): IdeSelection {
  if (!value || value === "combined") return "combined"
  const candidate = value.toLowerCase()
  return isIdeId(candidate) ? candidate : "combined"
}

export function validateIdeParam(value: string | null): IdeId | null {
  if (!value) return null
  const candidate = value.toLowerCase()
  return isIdeId(candidate) ? candidate : null
}
