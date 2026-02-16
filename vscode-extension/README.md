# VS Integrate - Coding Activity Tracker

A VS Code extension that tracks your coding activity and visualizes it with beautiful contribution graphs on your VS Integrate dashboard.

## Features

- **Automatic Activity Tracking**: Automatically detects when you're coding in VS Code
- **Language Detection**: Tracks which programming languages you're using
- **Idle Detection**: Automatically pauses tracking when you're away
- **Privacy First**: Only sends file extensions, not file names or code content
- **Status Bar Indicator**: See your tracking status at a glance

## Setup

### 1. Get Your API Key

1. Sign in to your VS Integrate dashboard at [your-domain.com/dashboard]
2. Navigate to Settings → API Key
3. Click "Generate API Key"
4. Copy the key (starts with `vsi_`)

### 2. Configure the Extension

**Option 1: Using Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "VS Integrate: Set API Key"
3. Paste your API key

**Option 2: Using Settings**
1. Go to VS Code Settings (`Ctrl+,`)
2. Search for "VS Integrate"
3. Enter your API key in the "Api Key" field

### 3. Configure Production Endpoint (Optional)

If you're using a deployed version, update the API endpoint:

1. Go to VS Code Settings
2. Search for "VS Integrate"
3. Update "Api Endpoint" to your production URL (e.g., `https://yourdomain.com/api/heartbeat`)

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `vsIntegrate.apiKey` | `""` | Your VS Integrate API key |
| `vsIntegrate.apiEndpoint` | `http://localhost:3000/api/heartbeat` | API endpoint URL |
| `vsIntegrate.heartbeatInterval` | `30` | Heartbeat interval in seconds |
| `vsIntegrate.idleTimeout` | `120` | Seconds before user is considered idle |

## Status Bar

The extension shows a status indicator in the bottom-right corner:

- `$(pulse) VS Integrate: Tracking` - Actively tracking your coding
- `$(clock) VS Integrate: Idle` - You appear to be idle
- `$(debug-disconnect) VS Integrate: No API Key` - API key not configured
- `$(alert) VS Integrate: Connection Error` - Cannot connect to server

## Privacy

This extension respects your privacy:

- **No Code Content**: We never send your actual code
- **File Names**: Only the extension (e.g., `.ts`, `.py`) is sent, not the full filename
- **Local First**: All data is sent to your configured endpoint only

## Commands

| Command | Description |
|---------|-------------|
| `VS Integrate: Set API Key` | Set your API key |
| `VS Integrate: Show Status` | Show current tracking status |
| `VS Integrate: Open Dashboard` | Open your VS Integrate dashboard |

## Building the Extension

```bash
cd vscode-extension
npm install
npm run compile
```

To create a `.vsix` package:

```bash
npx @vscode/vsce package
```

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## License

MIT
