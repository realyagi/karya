"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSafeUrl = validateSafeUrl;
exports.getSafeBaseDirectory = getSafeBaseDirectory;
exports.validateFilePath = validateFilePath;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function validateSafeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return { valid: false, error: 'URL must be a non-empty string.' };
    }
    const lower = rawUrl.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('file:') || lower.startsWith('vbscript:')) {
        return { valid: false, error: 'Potentially dangerous URL scheme rejected.' };
    }
    try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return { valid: false, error: 'Only http and https protocols are supported.' };
        }
        return { valid: true };
    }
    catch {
        return { valid: false, error: 'Invalid URL format.' };
    }
}
function getSafeBaseDirectory() {
    // Default safe root: Documents/Karya or user Desktop
    const karyaDir = path_1.default.join(os_1.default.homedir(), 'Documents', 'Karya');
    return karyaDir;
}
function validateFilePath(filename, subfolder) {
    if (!filename || typeof filename !== 'string') {
        return { safePath: null, error: 'Filename is required.' };
    }
    // Prevent path traversal
    if (filename.includes('..') || path_1.default.isAbsolute(filename)) {
        return { safePath: null, error: 'Path traversal or absolute paths are forbidden.' };
    }
    // Prevent invalid characters
    if (/[<>:"/\\|?*]/.test(filename)) {
        return { safePath: null, error: 'Filename contains forbidden filesystem characters.' };
    }
    const baseDir = getSafeBaseDirectory();
    const targetDir = subfolder ? path_1.default.join(baseDir, subfolder) : baseDir;
    const resolved = path_1.default.resolve(targetDir, filename);
    if (!resolved.startsWith(baseDir)) {
        return { safePath: null, error: 'Path escapes designated safe directory.' };
    }
    return { safePath: resolved };
}
