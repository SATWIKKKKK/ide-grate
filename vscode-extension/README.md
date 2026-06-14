# Cadence - Coding Activity Tracker

Cadence tracks real editor activity from the VS Code extension host family. The same VSIX supports VS Code, Cursor, and Google Antigravity. Runtime detection reports:

- `cursor` when `vscode.env.appName` includes `cursor`
- `antigravity` when it includes `antigravity`
- `vscode` otherwise

Existing command IDs, settings keys, `vsi_` API keys, and endpoint URLs remain compatible.

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
4. Paste your `vsi_` API key and heartbeat endpoint.
5. Run `Cadence: Test Connection`, then verify the selected editor on the Cadence setup page.

## Configuration

| Setting | Description |
| --- | --- |
| `vsIntegrate.apiKey` | Your Cadence API key. Existing `vsi_` keys are supported. |
| `vsIntegrate.apiEndpoint` | Site URL or full `/api/heartbeat` endpoint. |
| `vsIntegrate.heartbeatInterval` | Heartbeat interval in seconds. |
| `vsIntegrate.idleTimeout` | Seconds before the editor is considered idle. |

## Building

```bash
cd vscode-extension
npm install
npm run compile
```
