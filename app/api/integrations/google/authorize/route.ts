import { NextResponse } from 'next/server';
import { cookieOptions, createOAuthState, encodeState, getBaseUrl, stateCookieName } from '@/lib/integrations/session';
import { googleConfigured } from '@/lib/integrations/providers';

export async function GET(request: Request) {
  if (!googleConfigured()) return NextResponse.json({ error: 'Google Calendar OAuth is not configured.' }, { status: 503 });
  const state = createOAuthState('google-calendar');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: `${getBaseUrl(request)}/api/integrations/google/callback`, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'openid email https://www.googleapis.com/auth/calendar' }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set(stateCookieName('google-calendar'), encodeState(state), { ...cookieOptions(600), httpOnly: true });
  return response;
}