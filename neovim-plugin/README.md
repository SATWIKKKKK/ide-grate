# Cadence Neovim Plugin

Lua plugin for Cadence heartbeat telemetry.

## Install

Copy `lua/cadence.lua` into your runtime path, then configure:

```lua
require("cadence").setup({
  api_key = "vsi_your_key",
  endpoint = "https://your-cadence-site.com/api/heartbeat",
  debounce_ms = 30000,
})
```

## Commands

- `:CadenceTestConnection`

The payload uses `ide = "neovim"` and sends metadata only.
