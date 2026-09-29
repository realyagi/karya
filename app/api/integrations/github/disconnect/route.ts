import { NextResponse } from 'next/server';
import { cookieOptions, oauthCookieName } from '@/lib/integrations/session';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'GitHub disconnected.' });
  response.cookies.set(oauthCookieName('github'), '', cookieOptions(0));
  return response;
}