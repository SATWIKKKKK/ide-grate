import type { IdeId } from "./ide-config"

export type IdeSetupStep = {
  title: string
  detail: string
}

export type IdeSetupGuide = {
  summary: string
  steps: IdeSetupStep[]
  verify: string
}

export const IDE_SETUP_GUIDES: Record<IdeId, IdeSetupGuide> = {
  vscode: {
    summary: "Install the Cadence VSIX in VS Code, save your key, then run the built-in test command.",
    steps: [
      { title: "Download", detail: "Download cadence.vsix from this setup page." },
      { title: "Install", detail: "In VS Code, open Extensions and choose Install from VSIX." },
      { title: "Connect", detail: "Run Cadence: Set API Key and paste your key plus endpoint." },
      { title: "Verify", detail: "Run Cadence: Test Connection, then verify VS Code here." },
    ],
    verify: "A successful VS Code test records a heartbeat for VS Code. If verification fails, confirm the endpoint ends with /api/heartbeat.",
  },
  cursor: {
    summary: "Install the Cadence VSIX in Cursor so Cursor reports separately from VS Code.",
    steps: [
      { title: "Download", detail: "Download cadence.vsix or copy the Cursor install command." },
      { title: "Install", detail: "Run cursor --install-extension ./cadence.vsix or install from Cursor's Extensions view." },
      { title: "Connect", detail: "Run Cadence: Set API Key in Cursor and paste your key plus endpoint." },
      { title: "Verify", detail: "Run Cadence: Test Connection, then verify Cursor here." },
    ],
    verify: "A successful Cursor test records a heartbeat for Cursor. If it appears under VS Code, reload Cursor after installing the package.",
  },
  antigravity: {
    summary: "Install the Cadence VSIX in Antigravity's VS Code-compatible extension host.",
    steps: [
      { title: "Download", detail: "Download cadence.vsix from this setup page." },
      { title: "Install", detail: "Open Antigravity's extension view and install the VSIX package." },
      { title: "Connect", detail: "Run Cadence: Set API Key and save your key plus endpoint." },
      { title: "Verify", detail: "Run Cadence: Test Connection, then verify Antigravity here." },
    ],
    verify: "A successful Antigravity test records a heartbeat for Antigravity. If verification fails, reload the editor and run the test again.",
  },
  jetbrains: {
    summary: "Build or install the JetBrains plugin, save Cadence settings, then run the Tools menu test.",
    steps: [
      { title: "Build", detail: "From jetbrains-plugin, run gradle buildPlugin and install the generated plugin ZIP." },
      { title: "Configure", detail: "Open Settings or Preferences, search Cadence, and paste your API key plus endpoint." },
      { title: "Track", detail: "Open a project and edit files so Cadence can send debounced heartbeats." },
      { title: "Verify", detail: "Run Tools > Cadence > Test Connection, then verify JetBrains here." },
    ],
    verify: "A successful JetBrains test records a heartbeat for JetBrains. If verification fails, check the key, endpoint, and whether the plugin is enabled.",
  },
  zed: {
    summary: "Run the Cadence Zed companion while editing because Zed extension telemetry hooks are still limited.",
    steps: [
      { title: "Prepare", detail: "Keep the companion script in zed-extension/companion available locally." },
      { title: "Start", detail: "Run the companion with your Cadence key and heartbeat endpoint." },
      { title: "Track", detail: "Keep the companion running while Zed is open on your project." },
      { title: "Verify", detail: "Run the companion --test command, then verify Zed here." },
    ],
    verify: "A successful companion test records a heartbeat for Zed. If verification fails, check Python, network access, API key, and endpoint.",
  },
  neovim: {
    summary: "Load the Cadence Lua plugin, configure it once, then test from Neovim.",
    steps: [
      { title: "Install", detail: "Copy neovim-plugin/lua/cadence.lua into your Neovim Lua runtime path." },
      { title: "Configure", detail: "Add require('cadence').setup(...) with your API key and endpoint." },
      { title: "Reload", detail: "Restart Neovim or reload your config, then open a project buffer." },
      { title: "Verify", detail: "Run :CadenceTestConnection, then verify Neovim here." },
    ],
    verify: "A successful Neovim test records a heartbeat for Neovim. If verification fails, inspect :messages for API key or endpoint errors.",
  },
  sublime: {
    summary: "Install the Cadence Sublime package, save package settings, then run the command palette test.",
    steps: [
      { title: "Install", detail: "Copy the sublime-package folder into Sublime Text Packages/Cadence." },
      { title: "Configure", detail: "Open Preferences > Package Settings > Cadence and paste the settings JSON." },
      { title: "Track", detail: "Open a file in a project so Sublime can report editor activity." },
      { title: "Verify", detail: "Run Cadence: Test Connection, then verify Sublime here." },
    ],
    verify: "A successful Sublime test records a heartbeat for Sublime. If verification fails, confirm the package folder name and settings JSON.",
  },
}

export function getIdeSetupGuide(ide: IdeId): IdeSetupGuide {
  return IDE_SETUP_GUIDES[ide]
}
