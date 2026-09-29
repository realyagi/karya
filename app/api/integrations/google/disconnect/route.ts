import { NextResponse } from 'next/server';
import { cookieOptions, oauthCookieName } from '@/lib/integrations/session';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Google Calendar disconnected.' });
  response.cookies.set(oauthCookieName('google-calendar'), '', cookieOptions(0));
  return response;
}