import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';
import * as os from 'os';

let heartbeatInterval: NodeJS.Timeout | undefined;
let lastActivityTime: number = Date.now();
let statusBarItem: vscode.StatusBarItem;
let isTracking: boolean = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('VS Integrate extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'vs-integrate.showStatus';
    context.subscriptions.push(statusBarItem);

    // Register URI handler for deep-link authentication
    context.subscriptions.push(
        vscode.window.registerUriHandler({
            async handleUri(uri: vscode.Uri) {
                if (uri.path === '/auth') {
                    const params = new URLSearchParams(uri.query);
                    const apiKey = params.get('key');
                    const endpoint = params.get('endpoint');
                    if (apiKey) {
                        try {
                            await vscode.workspace.getConfiguration('vsIntegrate').update(
                                'apiKey', apiKey, vscode.ConfigurationTarget.Global
                            );
                            if (endpoint) {
                                await vscode.workspace.getConfiguration('vsIntegrate').update(
                                    'apiEndpoint', endpoint, vscode.ConfigurationTarget.Global
                                );
                            }
                            vscode.window.showInformationMessage(
                                '✅ VS Integrate connected! Your coding activity will now be tracked.'
                            );
                            startTracking();
                            // Send a connection test heartbeat immediately
                            try {
                                await sendConnectionTest();
                                vscode.window.showInformationMessage(
                                    '✅ Connection verified — you\'re all set!'
                                );
                            } catch {
                                vscode.window.showWarningMessage(
                                    '⚠️ API key saved, but connection test failed. Check your endpoint.'
                                );
                            }
                        } catch (err) {
                            vscode.window.showErrorMessage(
                                `Failed to save API key: ${err}`
                            );
                        }
                    }
                }
            }
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vs-integrate.setApiKey', setApiKey),
        vscode.commands.registerCommand('vs-integrate.showStatus', showStatus),
        vscode.commands.registerCommand('vs-integrate.openDashboard', openDashboard)
    );

    // Track editor activity
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(onActivity),
        vscode.workspace.onDidChangeTextDocument(onActivity),
        vscode.window.onDidChangeTextEditorSelection(onActivity),
        vscode.workspace.onDidSaveTextDocument(onActivity)
    );

    // Start tracking
    startTracking();
    updateStatusBar();
}

function getConfig() {
    const config = vscode.workspace.getConfiguration('vsIntegrate');
    return {
        apiKey: config.get<string>('apiKey') || '',
        apiEndpoint: config.get<string>('apiEndpoint') || 'http://localhost:3000/api/heartbeat',
        heartbeatInterval: config.get<number>('heartbeatInterval') || 30,
        idleTimeout: config.get<number>('idleTimeout') || 120
    };
}

function hashProjectPath(projectPath: string): string {
    return crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 16);
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

async function sendHeartbeat(): Promise<void> {
    const config = getConfig();
    
    if (!config.apiKey) {
        return;
    }

    const editor = vscode.window.activeTextEditor;
    const isIdle = (Date.now() - lastActivityTime) > (config.idleTimeout * 1000);
    
    // Hash the workspace folder path for privacy
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const projectPath = workspaceFolders?.[0]?.uri.fsPath || '';
    const projectHash = projectPath ? hashProjectPath(projectPath) : undefined;

    const payload = {
        apiKey: config.apiKey,
        timestamp: Date.now(),
        language: editor?.document.languageId || 'unknown',
        file: editor?.document.fileName ? getFileName(editor.document.fileName) : null,
        project: vscode.workspace.name || 'unknown',
        projectHash: projectHash,
        platform: os.platform(),
        isIdle: isIdle
    };

    try {
        await postData(config.apiEndpoint, payload);
        updateStatusBar(isIdle ? 'Idle' : 'Active');
    } catch (error) {
        console.error('Failed to send heartbeat:', error);
        updateStatusBar('Error');
        throw error;
    }
}

async function sendConnectionTest(): Promise<void> {
    const config = getConfig();
    
    if (!config.apiKey) {
        return;
    }

    const payload = {
        apiKey: config.apiKey,
        timestamp: Date.now(),
        type: 'connection_test',
        platform: os.platform(),
    };

    try {
        await postData(config.apiEndpoint, payload);
        updateStatusBar('Tracking');
    } catch (error) {
        console.error('Connection test failed:', error);
        updateStatusBar('Error');
        throw error;
    }
}

function postData(urlString: string, data: any): Promise<any> {
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
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function getFileName(fullPath: string): string {
    // Get just the filename without the full path for privacy
    const parts = fullPath.split(/[\\/]/);
    return parts[parts.length - 1];
}

function updateStatusBar(status?: string) {
    const config = getConfig();
    
    if (!config.apiKey) {
        statusBarItem.text = '$(debug-disconnect) VS Integrate: No API Key';
        statusBarItem.tooltip = 'Click to set your API key';
    } else if (status === 'Error') {
        statusBarItem.text = '$(alert) VS Integrate: Connection Error';
        statusBarItem.tooltip = 'Failed to connect to server. Check your API endpoint.';
    } else if (status === 'Idle') {
        statusBarItem.text = '$(clock) VS Integrate: Idle';
        statusBarItem.tooltip = 'Tracking paused - you appear to be idle';
    } else {
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
    
    vscode.window.showInformationMessage(message, 'Set API Key', 'Open Dashboard').then((selection: string | undefined) => {
        if (selection === 'Set API Key') {
            setApiKey();
        } else if (selection === 'Open Dashboard') {
            openDashboard();
        }
    });
}

function openDashboard() {
    const config = getConfig();
    const baseUrl = config.apiEndpoint.replace('/api/heartbeat', '');
    vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/dashboard`));
}

export function deactivate() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
}
