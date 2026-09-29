import { NextResponse } from 'next/server';
import { cookieOptions, decodeState, encryptTokenSet, getBaseUrl, oauthCookieName, stateCookieName, verifyOAuthState } from '@/lib/integrations/session';
import { githubConfigured } from '@/lib/integrations/providers';

export async function GET(request: Request) {
  if (!githubConfigured()) return NextResponse.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = request.headers.get('cookie')?.split('; ').find((part) => part.startsWith(`${stateCookieName('github')}=`))?.split('=')[1];
  if (!code || !state || !storedState || !verifyOAuthState(state, 'github') || decodeState(storedState) !== state) return NextResponse.json({ error: 'Invalid GitHub OAuth callback.' }, { status: 400 });
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${getBaseUrl(request)}/api/integrations/github/callback` }), cache: 'no-store' });
  if (!tokenResponse.ok) return NextResponse.json({ error: 'GitHub OAuth token exchange failed.' }, { status: 502 });
  const data = await tokenResponse.json() as { access_token?: string };
  if (!data.access_token) return NextResponse.json({ error: 'GitHub OAuth returned no access token.' }, { status: 502 });
  const response = NextResponse.redirect(new URL('/?integration=github-connected', getBaseUrl(request)));
  response.cookies.set(oauthCookieName('github'), encryptTokenSet({ accessToken: data.access_token }), cookieOptions());
  response.cookies.set(stateCookieName('github'), '', cookieOptions(0));
  return response;
}