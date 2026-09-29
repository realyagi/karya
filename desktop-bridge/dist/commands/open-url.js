"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openUrl = openUrl;
const child_process_1 = require("child_process");
const security_1 = require("../security");
async function openUrl(url) {
    const validation = (0, security_1.validateSafeUrl)(url);
    if (!validation.valid) {
        throw new Error(validation.error || 'Invalid or unsafe URL.');
    }
    return new Promise((resolve, reject) => {
        // On Windows, 'explorer <url>' or 'start <url>' launches default browser safely
        const child = (0, child_process_1.spawn)('cmd.exe', ['/c', 'start', '', url], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });
        child.on('error', (err) => {
            reject(new Error(`Failed to open URL in browser: ${err.message}`));
        });
        child.unref();
        resolve({
            url,
            message: `Opened ${url} in default browser.`,
        });
    });
}
