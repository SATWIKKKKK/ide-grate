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
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
let heartbeatInterval;
let lastActivityTime = Date.now();
let statusBarItem;
let isTracking = false;
let hasShownDisconnectedNotice = false;
let languageTimeMap = {};
let lastLanguageSwitchAt = Date.now();
let lastLanguageId = 'unknown';
let isWindowFocused = true;
const CONFIG_SECTION = 'cadence';
const LEGACY_EXTENSION_ID = `vs${'integrate'}.vs-integrate-tracker`;
const DEFAULT_API_ENDPOINT = 'https://ca-dence.vercel.app/api/heartbeat';
const LEGACY_ENDPOINT_HOST = 'vs-integrate.vercel.app';
const COMMANDS = {
    setApiKey: 'cadence.setApiKey',
    showStatus: 'cadence.showStatus',
    testConnection: 'cadence.testConnection',
    openDashboard: 'cadence.openDashboard',
};
function detectIde() {
    const appName = (vscode.env.appName || '').toLowerCase();
    if (appName.includes('cursor')) {
        return 'cursor';
    }
    if (appName.includes('antigravity')) {
        return 'antigravity';
    }
    return 'vscode';
}
function getProductLabel() {
    const ide = detectIde();
    if (ide === 'cursor')
        return 'Cursor';
    if (ide === 'antigravity')
        return 'Antigravity';
    return 'VS Code';
}
function normalizeApiEndpoint(input) {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) {
        return DEFAULT_API_ENDPOINT;
    }
    if (trimmed.includes(LEGACY_ENDPOINT_HOST)) {
        return DEFAULT_API_ENDPOINT;
    }
    if (trimmed.endsWith('/api/heartbeat')) {
        return trimmed;
    }
    if (trimmed.endsWith('/dashboard')) {
        return `${trimmed.slice(0, -'/dashboard'.length)}/api/heartbeat`;
    }
    return `${trimmed}/api/heartbeat`;
}
function activate(context) {
    console.log(`Cadence extension is now active in ${getProductLabel()}`);
    lastLanguageId = getCurrentLanguageId();
    lastLanguageSwitchAt = Date.now();
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = COMMANDS.showStatus;
    context.subscriptions.push(statusBarItem);
    // Register URI handler for deep-link authentication
    context.subscriptions.push(vscode.window.registerUriHandler({
        async handleUri(uri) {
            if (uri.path === '/auth') {
                const params = new URLSearchParams(uri.query);
                const apiKey = params.get('key');
                const endpoint = params.get('endpoint');
                if (apiKey) {
                    try {
                        await vscode.workspace.getConfiguration(CONFIG_SECTION).update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
                        if (endpoint) {
                            await vscode.workspace.getConfiguration(CONFIG_SECTION).update('apiEndpoint', endpoint, vscode.ConfigurationTarget.Global);
                        }
                        vscode.window.showInformationMessage('Cadence connected. Your coding activity will now be tracked.');
                        startTracking();
                        // Send a connection test heartbeat immediately
                        try {
                            await sendConnectionTest();
                            vscode.window.showInformationMessage('Connection verified. You are all set.');
                        }
                        catch {
                            vscode.window.showWarningMessage('API key saved, but connection test failed. Check your endpoint.');
                        }
                    }
                    catch (err) {
                        vscode.window.showErrorMessage(`Failed to save API key: ${err}`);
                    }
                }
            }
        }
    }));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand(COMMANDS.setApiKey, setApiKey), vscode.commands.registerCommand(COMMANDS.showStatus, showStatus), vscode.commands.registerCommand(COMMANDS.testConnection, testConnection), vscode.commands.registerCommand(COMMANDS.openDashboard, openDashboard));
    warnAboutLegacyExtension();
    // Track editor activity
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(onActivity), vscode.workspace.onDidChangeTextDocument(onActivity), vscode.window.onDidChangeTextEditorSelection(onActivity), vscode.workspace.onDidSaveTextDocument(onActivity));
    // Track window focus — mark idle immediately when VS Code loses focus
    context.subscriptions.push(vscode.window.onDidChangeWindowState((state) => {
        isWindowFocused = state.focused;
        if (!state.focused) {
            // Immediately mark as idle when window loses focus
            trackLanguageTime();
        }
        else {
            // Resume activity tracking when window regains focus
            lastActivityTime = Date.now();
            lastLanguageSwitchAt = Date.now();
            lastLanguageId = getCurrentLanguageId();
        }
    }));
    // Start tracking
    startTracking();
    updateStatusBar();
}
function getConfig() {
    return {
        apiKey: getConfiguredValue('apiKey', ''),
        apiEndpoint: normalizeApiEndpoint(getConfiguredValue('apiEndpoint', DEFAULT_API_ENDPOINT)),
        heartbeatInterval: getConfiguredValue('heartbeatInterval', 30),
        idleTimeout: getConfiguredValue('idleTimeout', 120)
    };
}
function getConfiguredValue(key, fallback) {
    const configured = getExplicitConfigValue(CONFIG_SECTION, key);
    if (configured !== undefined && configured !== '') {
        return configured;
    }
    return vscode.workspace.getConfiguration(CONFIG_SECTION).get(key) ?? fallback;
}
function getExplicitConfigValue(section, key) {
    const inspected = vscode.workspace.getConfiguration(section).inspect(key);
    return inspected?.workspaceFolderValue
        ?? inspected?.workspaceValue
        ?? inspected?.globalValue;
}
function hashProjectPath(projectPath) {
    return crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 16);
}
function startTracking() {
    const config = getConfig();
    if (!config.apiKey) {
        updateStatusBar('No API Key');
        return;
    }
    hasShownDisconnectedNotice = false;
    isTracking = true;
    lastLanguageId = getCurrentLanguageId();
    lastLanguageSwitchAt = Date.now();
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
    trackLanguageTime();
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
    const isIdle = !isWindowFocused || (Date.now() - lastActivityTime) > (config.idleTimeout * 1000);
    if (!isIdle) {
        trackLanguageTime();
    }
    else {
        lastLanguageId = getCurrentLanguageId();
        lastLanguageSwitchAt = Date.now();
    }
    // Hash the workspace folder path for privacy
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const projectPath = workspaceFolders?.[0]?.uri.fsPath || '';
    const projectHash = projectPath ? hashProjectPath(projectPath) : undefined;
    // Try to get GitHub repo URL
    let repoUrl;
    if (projectPath) {
        try {
            const remote = (0, child_process_1.execSync)('git config --get remote.origin.url', { cwd: projectPath, timeout: 3000 }).toString().trim();
            if (remote) {
                // Normalize SSH/HTTPS URLs to a clean HTTPS URL
                repoUrl = remote
                    .replace(/^git@github\.com:/, 'https://github.com/')
                    .replace(/^git@([^:]+):/, 'https://$1/')
                    .replace(/\.git$/, '');
            }
        }
        catch { /* not a git repo or no remote */ }
    }
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const payload = {
        apiKey: config.apiKey,
        ide: detectIde(),
        timestamp: Date.now(),
        language: editor?.document.languageId || 'unknown',
        languageBreakdown: { ...languageTimeMap },
        file: editor?.document.fileName ? getFileName(editor.document.fileName) : null,
        project: vscode.workspace.name || 'unknown',
        projectHash: projectHash,
        repoUrl: repoUrl,
        platform: os.platform(),
        isIdle: isIdle,
        timezoneOffset: now.getTimezoneOffset(),
        localDate: localDate,
    };
    try {
        await postData(config.apiEndpoint, payload);
        updateStatusBar(isIdle ? 'Idle' : 'Active');
    }
    catch (error) {
        if (error.statusCode === 401) {
            await handleManualDisconnect();
            return;
        }
        console.error('Failed to send heartbeat:', error);
        updateStatusBar('Error');
    }
}
function getCurrentLanguageId() {
    return vscode.window.activeTextEditor?.document.languageId || 'unknown';
}
function trackLanguageTime() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastLanguageSwitchAt) / 1000);
    if (elapsedSeconds > 0 && lastLanguageId && lastLanguageId !== 'unknown') {
        languageTimeMap[lastLanguageId] = (languageTimeMap[lastLanguageId] || 0) + elapsedSeconds;
    }
    lastLanguageId = getCurrentLanguageId();
    lastLanguageSwitchAt = now;
}
async function sendConnectionTest() {
    const config = getConfig();
    if (!config.apiKey) {
        throw new Error('Cadence API key is missing');
    }
    const connNow = new Date();
    const payload = {
        apiKey: config.apiKey,
        ide: detectIde(),
        timestamp: Date.now(),
        type: 'connection_test',
        platform: os.platform(),
        timezoneOffset: connNow.getTimezoneOffset(),
    };
    try {
        await postData(config.apiEndpoint, payload);
        updateStatusBar('Tracking');
    }
    catch (error) {
        if (error.statusCode === 401) {
            await handleManualDisconnect();
            return;
        }
        console.error('Connection test failed:', error);
        updateStatusBar('Error');
        throw error;
    }
}
async function testConnection() {
    try {
        await sendConnectionTest();
        vscode.window.showInformationMessage(`Cadence connection verified for ${getProductLabel()}.`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Cadence connection failed for ${getProductLabel()}: ${error instanceof Error ? error.message : 'check your API key and endpoint'}`);
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
                'Authorization': `Bearer ${data.apiKey || ''}`,
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
                    const httpError = new Error(`HTTP ${res.statusCode}: ${body}`);
                    httpError.statusCode = res.statusCode;
                    httpError.responseBody = body;
                    reject(httpError);
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
        statusBarItem.text = '$(debug-disconnect) Cadence: No API Key';
        statusBarItem.tooltip = 'Click to set your API key';
    }
    else if (status === 'Disconnected') {
        statusBarItem.text = '$(debug-disconnect) Cadence: Disconnected';
        statusBarItem.tooltip = 'API key has been disconnected. Reconnect to resume tracking.';
    }
    else if (status === 'Error') {
        statusBarItem.text = '$(alert) Cadence: Connection Error';
        statusBarItem.tooltip = 'Failed to connect to server. Check your API endpoint.';
    }
    else if (status === 'Idle') {
        statusBarItem.text = '$(clock) Cadence: Idle';
        statusBarItem.tooltip = 'Tracking paused - you appear to be idle';
    }
    else {
        statusBarItem.text = `$(pulse) Cadence: ${getProductLabel()}`;
        statusBarItem.tooltip = `Tracking ${getProductLabel()} coding activity`;
    }
    statusBarItem.show();
}
async function handleManualDisconnect() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = undefined;
    }
    isTracking = false;
    updateStatusBar('Disconnected');
    if (hasShownDisconnectedNotice) {
        return;
    }
    hasShownDisconnectedNotice = true;
    const legacyInstalled = Boolean(vscode.extensions.getExtension(LEGACY_EXTENSION_ID));
    const selection = await vscode.window.showWarningMessage(legacyInstalled
        ? `API key has been disconnected for ${getProductLabel()}. The old tracker extension is also installed; uninstall it to stop duplicate tracking warnings.`
        : `API key has been disconnected, please reconnect for ${getProductLabel()} tracking.`, 'Reconnect Now', 'Open Dashboard');
    if (selection === 'Reconnect Now') {
        await setApiKey();
    }
    else if (selection === 'Open Dashboard') {
        openDashboard();
    }
}
async function warnAboutLegacyExtension() {
    if (!vscode.extensions.getExtension(LEGACY_EXTENSION_ID)) {
        return;
    }
    const selection = await vscode.window.showWarningMessage('The old tracker extension is still installed. Uninstall it so Cadence is the only tracker running.', 'Copy uninstall command', 'Open Extensions');
    if (selection === 'Copy uninstall command') {
        await vscode.env.clipboard.writeText('code --uninstall-extension vsintegrate.vs-integrate-tracker');
        vscode.window.showInformationMessage('Uninstall command copied.');
    }
    else if (selection === 'Open Extensions') {
        vscode.commands.executeCommand('workbench.extensions.search', '@installed vsintegrate');
    }
}
async function setApiKey() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Cadence API Key',
        placeHolder: 'cad_xxxxxxxxxxxx',
        password: false,
        ignoreFocusOut: true
    });
    if (apiKey) {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const currentEndpoint = normalizeApiEndpoint(getConfiguredValue('apiEndpoint', DEFAULT_API_ENDPOINT));
        const endpointInput = await vscode.window.showInputBox({
            prompt: 'Enter your Cadence site URL or heartbeat endpoint',
            placeHolder: 'https://your-site.com or http://localhost:3001/api/heartbeat',
            value: currentEndpoint,
            ignoreFocusOut: true,
        });
        if (endpointInput === undefined) {
            return;
        }
        await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        await config.update('apiEndpoint', normalizeApiEndpoint(endpointInput), vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Cadence API key saved. Tracking will start now.');
        startTracking();
    }
}
function showStatus() {
    const config = getConfig();
    const timeSinceActivity = Math.round((Date.now() - lastActivityTime) / 1000);
    const message = config.apiKey
        ? `Cadence is ${isTracking ? 'tracking' : 'not tracking'} ${getProductLabel()}.\nLast activity: ${timeSinceActivity}s ago`
        : 'Cadence needs an API key. Get one from your dashboard.';
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