"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFolder = openFolder;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const APPROVED_FOLDERS = {
    desktop: () => path_1.default.join(os_1.default.homedir(), 'Desktop'),
    documents: () => path_1.default.join(os_1.default.homedir(), 'Documents'),
    downloads: () => path_1.default.join(os_1.default.homedir(), 'Downloads'),
    pictures: () => path_1.default.join(os_1.default.homedir(), 'Pictures'),
    music: () => path_1.default.join(os_1.default.homedir(), 'Music'),
    videos: () => path_1.default.join(os_1.default.homedir(), 'Videos'),
};
async function openFolder(folderName) {
    if (!folderName || typeof folderName !== 'string') {
        throw new Error('Folder name is required.');
    }
    const normalized = folderName.trim().toLowerCase();
    const resolver = APPROVED_FOLDERS[normalized];
    if (!resolver) {
        const supported = Object.keys(APPROVED_FOLDERS).join(', ');
        throw new Error(`Folder "${folderName}" is not an approved safe folder. Approved folders: ${supported}.`);
    }
    const resolvedPath = resolver();
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('explorer.exe', [resolvedPath], {
            detached: true,
            stdio: 'ignore',
        });
        child.on('error', (err) => {
            reject(new Error(`Failed to open folder ${folderName}: ${err.message}`));
        });
        child.unref();
        resolve({
            folder: normalized,
            path: resolvedPath,
            message: `Opened ${folderName} folder in File Explorer.`,
        });
    });
}
