"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const auth_1 = require("./auth");
const open_application_1 = require("./commands/open-application");
const open_url_1 = require("./commands/open-url");
const open_folder_1 = require("./commands/open-folder");
const create_file_1 = require("./commands/create-file");
const read_selected_file_1 = require("./commands/read-selected-file");
const screenshot_1 = require("./commands/screenshot");
const system_info_1 = require("./commands/system-info");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 48123;
const HOST = '127.0.0.1'; // MUST be localhost only
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data));
}
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 5 * 1024 * 1024) {
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (e) {
                reject(new Error('Malformed JSON'));
            }
        });
        req.on('error', reject);
    });
}
const server = http_1.default.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        res.end();
        return;
    }
    const url = req.url ? new URL(req.url, `http://${HOST}:${PORT}`) : null;
    const pathname = url?.pathname;
    // 1. Health & status check (unauthenticated, safe read)
    if (req.method === 'GET' && pathname === '/status') {
        sendJson(res, 200, {
            status: 'running',
            service: 'KARYA Desktop Bridge',
            port: PORT,
            version: '1.0.0',
        });
        return;
    }
    // 2. Query or refresh pairing code (displayed in terminal or bridge UI)
    if (req.method === 'GET' && pathname === '/pairing-code') {
        sendJson(res, 200, {
            pairingCode: (0, auth_1.getCurrentPairingCode)(),
        });
        return;
    }
    // 3. Pairing handshake: client exchanges pairing code for single auth token
    if (req.method === 'POST' && pathname === '/pair') {
        try {
            const body = await parseJsonBody(req);
            if (!body.pairingCode) {
                sendJson(res, 400, { success: false, error: 'Pairing code is required.' });
                return;
            }
            const token = (0, auth_1.validateAndExchangePairingCode)(body.pairingCode);
            if (!token) {
                sendJson(res, 401, { success: false, error: 'Invalid or expired pairing code.' });
                return;
            }
            console.log('[DesktopBridge] Successful pairing exchange with KARYA client.');
            sendJson(res, 200, { success: true, authToken: token });
            return;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            sendJson(res, 400, { success: false, error: msg });
            return;
        }
    }
    // 4. Command execution endpoint
    if (req.method === 'POST' && pathname === '/command') {
        let requestId = 'unknown';
        try {
            const body = await parseJsonBody(req);
            requestId = body.requestId || 'unknown';
            // Verify authentication
            if (!body.authToken || !(0, auth_1.verifyAuthToken)(body.authToken)) {
                sendJson(res, 401, {
                    requestId,
                    success: false,
                    error: 'Unauthorized. Invalid or missing desktop bridge authentication token.',
                });
                return;
            }
            const { command, arguments: args } = body;
            console.log(`[DesktopBridge] Executing command "${command}" (requestId: ${requestId})`);
            let result;
            switch (command) {
                case 'desktop.open_application': {
                    const appName = String(args?.app || args?.name || '');
                    result = await (0, open_application_1.openApplication)(appName);
                    break;
                }
                case 'desktop.open_url': {
                    const targetUrl = String(args?.url || '');
                    result = await (0, open_url_1.openUrl)(targetUrl);
                    break;
                }
                case 'desktop.open_folder': {
                    const folderName = String(args?.folder || args?.name || '');
                    result = await (0, open_folder_1.openFolder)(folderName);
                    break;
                }
                case 'desktop.create_local_file': {
                    const filename = String(args?.filename || '');
                    const content = String(args?.content || '');
                    const subfolder = args?.subfolder ? String(args.subfolder) : undefined;
                    result = await (0, create_file_1.createLocalFile)(filename, content, subfolder);
                    break;
                }
                case 'desktop.read_selected_file': {
                    result = await (0, read_selected_file_1.readSelectedFile)();
                    break;
                }
                case 'desktop.take_screenshot': {
                    result = await (0, screenshot_1.takeScreenshot)();
                    break;
                }
                case 'desktop.get_system_info': {
                    result = (0, system_info_1.getSystemInfo)();
                    break;
                }
                default:
                    sendJson(res, 400, {
                        requestId,
                        success: false,
                        error: `Unsupported command "${command}".`,
                    });
                    return;
            }
            sendJson(res, 200, {
                requestId,
                success: true,
                result,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[DesktopBridge] Error executing ${requestId}:`, msg);
            sendJson(res, 500, {
                requestId,
                success: false,
                error: msg,
            });
        }
        return;
    }
    // 5. Disconnect / revoke
    if (req.method === 'POST' && pathname === '/disconnect') {
        (0, auth_1.revokeAllTokens)();
        sendJson(res, 200, { success: true, message: 'All tokens revoked.' });
        return;
    }
    sendJson(res, 404, { error: 'Not Found' });
});
server.listen(PORT, HOST, () => {
    const pairingCode = (0, auth_1.generatePairingCode)();
    console.log('====================================================');
    console.log(` KARYA Windows Desktop Bridge Server`);
    console.log(` Running locally on: http://${HOST}:${PORT}`);
    console.log(` One-Time Pairing Code: >>> ${pairingCode} <<<`);
    console.log(` Enter this code in KARYA Settings -> Desktop Bridge`);
    console.log('====================================================');
});
