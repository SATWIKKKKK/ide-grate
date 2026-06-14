# Cadence - Coding Activity Tracker

Cadence tracks real editor activity from the VS Code extension host family. The same VSIX supports VS Code, Cursor, and Google Antigravity. Runtime detection reports:

- `cursor` when `vscode.env.appName` includes `cursor`
- `antigravity` when it includes `antigravity`
- `vscode` otherwise

Cadence command IDs and settings use the `cadence.*` namespace.

## Features

- Automatic activity tracking with debounced heartbeats
- Language and idle detection
- Anonymized project hashes and optional repository URL mapping
- Bearer auth plus legacy body `apiKey`
- Status bar indicator and connection test

## Setup

1. Open Cadence Dashboard > Setup.
2. Download the VSIX and install it in VS Code, Cursor, or Antigravity.
3. Run `Cadence: Set API Key`.
4. Paste your Cadence API key and heartbeat endpoint.
5. Run `Cadence: Test Connection`, then verify the selected editor on the Cadence setup page.

## Configuration

| Setting | Description |
| --- | --- |
| `cadence.apiKey` | Your Cadence API key. |
| `cadence.apiEndpoint` | Site URL or full `/api/heartbeat` endpoint. |
| `cadence.heartbeatInterval` | Heartbeat interval in seconds. |
| `cadence.idleTimeout` | Seconds before the editor is considered idle. |

## Building

```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package --no-dependencies
```

From the repository root, install the packaged extension with:

```bash
code --install-extension .\cadence.vsix --force
```
