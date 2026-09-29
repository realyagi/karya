import crypto from 'crypto';

interface ActivePairingCode {
  code: string;
  createdAt: number;
  expiresAt: number;
}

let activePairingCode: ActivePairingCode | null = null;
const validTokens = new Set<string>();

export function generatePairingCode(): string {
  // Generate a friendly 6-digit alphanumeric pairing code
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const now = Date.now();
  activePairingCode = {
    code,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
  };
  return code;
}

export function getCurrentPairingCode(): string {
  if (!activePairingCode || Date.now() > activePairingCode.expiresAt) {
    return generatePairingCode();
  }
  return activePairingCode.code;
}

export function validateAndExchangePairingCode(candidateCode: string): string | null {
  if (!activePairingCode) return null;
  if (Date.now() > activePairingCode.expiresAt) {
    activePairingCode = null;
    return null;
  }

  if (activePairingCode.code.toLowerCase() === candidateCode.trim().toLowerCase()) {
    activePairingCode = null; // Single-use!
    const token = `karya_dt_${crypto.randomBytes(24).toString('hex')}`;
    validTokens.add(token);
    return token;
  }

  return null;
}

export function verifyAuthToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  return validTokens.has(token);
}

export function revokeToken(token: string): boolean {
  return validTokens.delete(token);
}

export function revokeAllTokens(): void {
  validTokens.clear();
}
