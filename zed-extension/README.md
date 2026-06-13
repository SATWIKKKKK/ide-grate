# Cadence Zed Support

Zed support is intentionally split into:

- A minimal extension scaffold that can build against Zed's extension API.
- A companion CLI that sends `ide = "zed"` heartbeats.

Current public Zed extension capabilities do not expose reliable general buffer-save HTTP telemetry hooks for arbitrary files, so Cadence does not pretend the extension can capture every edit on its own.

## Companion CLI

```bash
python companion/cadence_zed_heartbeat.py \
  --api-key vsi_your_key \
  --endpoint https://your-cadence-site.com/api/heartbeat
```

Connection test:

```bash
python companion/cadence_zed_heartbeat.py --api-key vsi_your_key --test
```

Marketplace publishing/signing is separate release work.
