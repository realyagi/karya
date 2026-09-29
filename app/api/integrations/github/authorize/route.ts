import { NextResponse } from 'next/server';
import { cookieOptions, createOAuthState, encodeState, getBaseUrl, stateCookieName } from '@/lib/integrations/session';
import { githubConfigured } from '@/lib/integrations/providers';

export async function GET(request: Request) {
  if (!githubConfigured()) return NextResponse.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  const state = createOAuthState('github');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID!, redirect_uri: `${getBaseUrl(request)}/api/integrations/github/callback`, state, scope: 'read:user user:email repo' }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set(stateCookieName('github'), encodeState(state), { ...cookieOptions(600), httpOnly: true });
  return response;
}