"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
let heartbeatInterval;
let lastActivityTime = Date.now();
let statusBarItem;
let isTracking = false;
function activate(context) {
    console.log('VS Integrate extension is now active');
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'vs-integrate.showStatus';
    context.subscriptions.push(statusBarItem);
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('vs-integrate.setApiKey', setApiKey), vscode.commands.registerCommand('vs-integrate.showStatus', showStatus), vscode.commands.registerCommand('vs-integrate.openDashboard', openDashboard));
    // Track editor activity
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(onActivity), vscode.workspace.onDidChangeTextDocument(onActivity), vscode.window.onDidChangeTextEditorSelection(onActivity), vscode.workspace.onDidSaveTextDocument(onActivity));
    // Start tracking
    startTracking();
    updateStatusBar();
}
function getConfig() {
    const config = vscode.workspace.getConfiguration('vsIntegrate');
    return {
        apiKey: config.get('apiKey') || '',
        apiEndpoint: config.get('apiEndpoint') || 'http://localhost:3000/api/heartbeat',
        heartbeatInterval: config.get('heartbeatInterval') || 30,
        idleTimeout: config.get('idleTimeout') || 120
    };
}
function startTracking() {
    const config = getConfig();
    if (!config.apiKey) {
        updateStatusBar('No API Key');
        return;
    }
    isTracking = true;
    updateStatusBar('Tracking');
    // Clear any existing interval
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    // Send initial heartbeat
    sendHeartbeat();
    // Set up periodic heartbeats
    heartbeatInterval = setInterval(() => {
        sendHeartbeat();
    }, config.heartbeatInterval * 1000);
}
function onActivity() {
    lastActivityTime = Date.now();
    // Start tracking if not already
    if (!isTracking) {
        startTracking();
    }
}
async function sendHeartbeat() {
    const config = getConfig();
    if (!config.apiKey) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    const isIdle = (Date.now() - lastActivityTime) > (config.idleTimeout * 1000);
    const payload = {
        apiKey: config.apiKey,
        timestamp: Date.now(),
        language: editor?.document.languageId || 'unknown',
        file: editor?.document.fileName ? getFileName(editor.document.fileName) : null,
        project: vscode.workspace.name || 'unknown',
        isIdle: isIdle
    };
    try {
        await postData(config.apiEndpoint, payload);
        updateStatusBar(isIdle ? 'Idle' : 'Active');
    }
    catch (error) {
        console.error('Failed to send heartbeat:', error);
        updateStatusBar('Error');
    }
}
function postData(urlString, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;
        const postData = JSON.stringify(data);
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body || '{}'));
                }
                else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}
function getFileName(fullPath) {
    // Get just the filename without the full path for privacy
    const parts = fullPath.split(/[\\/]/);
    return parts[parts.length - 1];
}
function updateStatusBar(status) {
    const config = getConfig();
    if (!config.apiKey) {
        statusBarItem.text = '$(debug-disconnect) VS Integrate: No API Key';
        statusBarItem.tooltip = 'Click to set your API key';
    }
    else if (status === 'Error') {
        statusBarItem.text = '$(alert) VS Integrate: Connection Error';
        statusBarItem.tooltip = 'Failed to connect to server. Check your API endpoint.';
    }
    else if (status === 'Idle') {
        statusBarItem.text = '$(clock) VS Integrate: Idle';
        statusBarItem.tooltip = 'Tracking paused - you appear to be idle';
    }
    else {
        statusBarItem.text = '$(pulse) VS Integrate: Tracking';
        statusBarItem.tooltip = 'Tracking your coding activity';
    }
    statusBarItem.show();
}
async function setApiKey() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your VS Integrate API Key',
        placeHolder: 'vsi_xxxxxxxxxxxx',
        password: false,
        ignoreFocusOut: true
    });
    if (apiKey) {
        const config = vscode.workspace.getConfiguration('vsIntegrate');
        await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('API Key saved! Tracking will start now.');
        startTracking();
    }
}
function showStatus() {
    const config = getConfig();
    const timeSinceActivity = Math.round((Date.now() - lastActivityTime) / 1000);
    const message = config.apiKey
        ? `VS Integrate is ${isTracking ? 'tracking' : 'not tracking'}.\nLast activity: ${timeSinceActivity}s ago\nEndpoint: ${config.apiEndpoint}`
        : 'VS Integrate needs an API key. Get one from your dashboard.';
    vscode.window.showInformationMessage(message, 'Set API Key', 'Open Dashboard').then((selection) => {
        if (selection === 'Set API Key') {
            setApiKey();
        }
        else if (selection === 'Open Dashboard') {
            openDashboard();
        }
    });
}
function openDashboard() {
    const config = getConfig();
    const baseUrl = config.apiEndpoint.replace('/api/heartbeat', '');
    vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/dashboard`));
}
function deactivate() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
}
//# sourceMappingURL=extension.js.map