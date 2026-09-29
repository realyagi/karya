"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalFile = createLocalFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const security_1 = require("../security");
async function createLocalFile(filename, content, subfolder) {
    const validation = (0, security_1.validateFilePath)(filename, subfolder);
    if (!validation.safePath) {
        throw new Error(validation.error || 'Invalid file target path.');
    }
    const targetPath = validation.safePath;
    const targetDir = path_1.default.dirname(targetPath);
    if (!fs_1.default.existsSync(targetDir)) {
        fs_1.default.mkdirSync(targetDir, { recursive: true });
    }
    fs_1.default.writeFileSync(targetPath, content || '', 'utf8');
    const stat = fs_1.default.statSync(targetPath);
    return {
        filename,
        path: targetPath,
        size: stat.size,
        message: `File "${filename}" created successfully at ${targetPath}.`,
    };
}
