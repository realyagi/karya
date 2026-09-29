import { NextResponse } from 'next/server';
import { cookieOptions, decodeState, encryptTokenSet, getBaseUrl, oauthCookieName, stateCookieName, verifyOAuthState } from '@/lib/integrations/session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = request.headers.get('cookie')?.split('; ').find((part) => part.startsWith(`${stateCookieName('google-calendar')}=`))?.split('=')[1];
  if (!code || !state || !storedState || !verifyOAuthState(state, 'google-calendar') || decodeState(storedState) !== state) return NextResponse.json({ error: 'Invalid Google OAuth callback.' }, { status: 400 });
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${getBaseUrl(request)}/api/integrations/google/callback`, grant_type: 'authorization_code' }), cache: 'no-store' });
  if (!tokenResponse.ok) return NextResponse.json({ error: 'Google OAuth token exchange failed.' }, { status: 502 });
  const data = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) return NextResponse.json({ error: 'Google OAuth returned no access token.' }, { status: 502 });
  const response = NextResponse.redirect(new URL('/?integration=google-calendar-connected', getBaseUrl(request)));
  response.cookies.set(oauthCookieName('google-calendar'), encryptTokenSet({ accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 }), cookieOptions());
  response.cookies.set(stateCookieName('google-calendar'), '', cookieOptions(0));
  return response;
}