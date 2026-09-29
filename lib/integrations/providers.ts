import { OAuthTokenSet } from '@/types/integrations';
import { decryptTokenSet, oauthCookieName } from '@/lib/integrations/session';

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.KARYA_SESSION_SECRET);
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.KARYA_SESSION_SECRET);
}

export async function refreshGoogleToken(tokens: OAuthTokenSet): Promise<OAuthTokenSet> {
  if (!tokens.refreshToken || !tokens.expiresAt || tokens.expiresAt > Date.now() + 60_000) return tokens;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: tokens.refreshToken, grant_type: 'refresh_token' }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Google token refresh failed.');
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('Google token refresh returned no access token.');
  return { ...tokens, accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
}

export async function getGoogleTokens(request: Request): Promise<OAuthTokenSet | null> {
  const cookie = request.headers.get('cookie')?.split('; ').find((part) => part.startsWith(`${oauthCookieName('google-calendar')}=`))?.split('=')[1];
  const tokens = cookie ? decryptTokenSet(cookie) : null;
  return tokens ? refreshGoogleToken(tokens) : null;
}