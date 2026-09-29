import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { OAuthTokenSet } from '@/types/integrations';

const COOKIE_PREFIX = 'karya.oauth.';
const STATE_PREFIX = 'karya.oauth.state.';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): Buffer {
  const value = process.env.KARYA_SESSION_SECRET;
  if (!value) throw new Error('KARYA_SESSION_SECRET is not configured.');
  return createHash('sha256').update(value).digest();
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function encryptTokenSet(tokens: OAuthTokenSet): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

export function decryptTokenSet(value: string): OAuthTokenSet | null {
  try {
    const [ivValue, tagValue, ciphertextValue] = value.split('.');
    if (!ivValue || !tagValue || !ciphertextValue) return null;
    const decipher = createDecipheriv('aes-256-gcm', secret(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const parsed: unknown = JSON.parse(plaintext);
    if (!parsed || typeof parsed !== 'object' || !('accessToken' in parsed)) return null;
    return parsed as OAuthTokenSet;
  } catch {
    return null;
  }
}

export function createOAuthState(provider: string): string {
  const nonce = randomBytes(24).toString('base64url');
  const signature = createHmac('sha256', secret()).update(`${provider}.${nonce}`).digest('base64url');
  return `${provider}.${nonce}.${signature}`;
}

export function verifyOAuthState(state: string, provider: string): boolean {
  const [stateProvider, nonce, signature] = state.split('.');
  if (!stateProvider || !nonce || !signature || stateProvider !== provider) return false;
  const expected = createHmac('sha256', secret()).update(`${provider}.${nonce}`).digest('base64url');
  return signature.length === expected.length && createHmac('sha256', secret()).update(signature).digest().equals(createHmac('sha256', secret()).update(expected).digest());
}

export function oauthCookieName(provider: string): string {
  return `${COOKIE_PREFIX}${provider}`;
}

export function stateCookieName(provider: string): string {
  return `${STATE_PREFIX}${provider}`;
}

export function cookieOptions(maxAge = MAX_AGE_SECONDS) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

export function getBaseUrl(request: Request): string {
  return process.env.KARYA_PUBLIC_URL || new URL(request.url).origin;
}

export function encodeState(state: string): string {
  return encode(state);
}

export function decodeState(state: string): string {
  return decode(state);
}