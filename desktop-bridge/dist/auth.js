"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePairingCode = generatePairingCode;
exports.getCurrentPairingCode = getCurrentPairingCode;
exports.validateAndExchangePairingCode = validateAndExchangePairingCode;
exports.verifyAuthToken = verifyAuthToken;
exports.revokeToken = revokeToken;
exports.revokeAllTokens = revokeAllTokens;
const crypto_1 = __importDefault(require("crypto"));
let activePairingCode = null;
const validTokens = new Set();
function generatePairingCode() {
    // Generate a friendly 6-digit alphanumeric pairing code
    const code = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    const now = Date.now();
    activePairingCode = {
        code,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
    };
    return code;
}
function getCurrentPairingCode() {
    if (!activePairingCode || Date.now() > activePairingCode.expiresAt) {
        return generatePairingCode();
    }
    return activePairingCode.code;
}
function validateAndExchangePairingCode(candidateCode) {
    if (!activePairingCode)
        return null;
    if (Date.now() > activePairingCode.expiresAt) {
        activePairingCode = null;
        return null;
    }
    if (activePairingCode.code.toLowerCase() === candidateCode.trim().toLowerCase()) {
        activePairingCode = null; // Single-use!
        const token = `karya_dt_${crypto_1.default.randomBytes(24).toString('hex')}`;
        validTokens.add(token);
        return token;
    }
    return null;
}
function verifyAuthToken(token) {
    if (!token || typeof token !== 'string')
        return false;
    return validTokens.has(token);
}
function revokeToken(token) {
    return validTokens.delete(token);
}
function revokeAllTokens() {
    validTokens.clear();
}
