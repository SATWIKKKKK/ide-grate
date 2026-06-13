# Cadence JetBrains Plugin

Buildable JetBrains plugin scaffold for Cadence telemetry.

## Features

- Debounced document-change heartbeats
- App-level settings for `vsi_` API key and endpoint
- Bearer auth and `ide: "jetbrains"` payloads
- Tools menu connection test

## Build

```bash
cd jetbrains-plugin
gradle buildPlugin
```

Marketplace signing and publishing are separate release tasks.
