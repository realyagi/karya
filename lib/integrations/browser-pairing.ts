import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface PairingEntry {
  code: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory pairing code storage (5 min expiration, single use)
const pairingStore = new Map<string, PairingEntry>();
const pairedTokens = new Set<string>();

export function getPairedTokens(): Set<string> {
  return pairedTokens;
}

export function generateBrowserPairingCode(): string {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const now = Date.now();
  // Clear expired codes
  for (const [key, entry] of pairingStore.entries()) {
    if (now > entry.expiresAt) pairingStore.delete(key);
  }
  pairingStore.set(code, {
    code,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000,
  });
  return code;
}

export function validateBrowserPairingCode(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  const entry = pairingStore.get(normalized);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pairingStore.delete(normalized);
    return null;
  }
  // Single-use
  pairingStore.delete(normalized);
  const token = `karya_ext_${crypto.randomUUID()}`;
  pairedTokens.add(token);
  return token;
}

export function isTokenValid(token: string): boolean {
  return pairedTokens.has(token);
}

export function revokeAllBrowserTokens(): void {
  pairedTokens.clear();
}
