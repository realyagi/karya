import { NextResponse } from 'next/server';
import { googleConfigured } from '@/lib/integrations/providers';
import { oauthCookieName } from '@/lib/integrations/session';

export async function GET(request: Request) {
  if (!googleConfigured()) return NextResponse.json({ provider: 'google-calendar', status: 'not-configured', message: 'Add Google OAuth credentials to connect Calendar.' });
  const connected = request.headers.get('cookie')?.includes(`${oauthCookieName('google-calendar')}=`) ?? false;
  return NextResponse.json({ provider: 'google-calendar', status: connected ? 'connected' : 'not-connected' });
}