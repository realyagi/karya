import { NextResponse } from 'next/server';
import { githubConfigured } from '@/lib/integrations/providers';
import { oauthCookieName } from '@/lib/integrations/session';

export async function GET(request: Request) {
  if (!githubConfigured()) return NextResponse.json({ provider: 'github', status: 'not-configured', message: 'Add GitHub OAuth credentials to connect GitHub.' });
  const connected = request.headers.get('cookie')?.includes(`${oauthCookieName('github')}=`) ?? false;
  return NextResponse.json({ provider: 'github', status: connected ? 'connected' : 'not-connected' });
}