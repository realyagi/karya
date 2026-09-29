import { NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/integrations/providers';

const calendarBase = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function authorizedRequest(request: Request, url: string, init: RequestInit = {}) {
  const tokens = await getGoogleTokens(request);
  if (!tokens) return NextResponse.json({ error: 'Google Calendar is not connected.' }, { status: 401 });
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${tokens.accessToken}`, 'content-type': 'application/json', ...(init.headers || {}) }, cache: 'no-store' });
  if (!response.ok) return NextResponse.json({ error: 'Google Calendar API request failed.' }, { status: response.status });
  const data = response.status === 204 ? null : await response.json();
  return NextResponse.json({ success: true, data });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', timeMin: url.searchParams.get('timeMin') || new Date().toISOString(), maxResults: url.searchParams.get('maxResults') || '50' });
  if (url.searchParams.get('q')) params.set('q', url.searchParams.get('q')!);
  return authorizedRequest(request, `${calendarBase}?${params.toString()}`);
}

export async function POST(request: Request) {
  const body = await request.json() as { summary?: string; description?: string; location?: string; start?: string; end?: string; timeZone?: string };
  if (!body.summary || !body.start || !body.end) return NextResponse.json({ error: 'summary, start, and end are required.' }, { status: 400 });
  return authorizedRequest(request, calendarBase, { method: 'POST', body: JSON.stringify({ summary: body.summary, description: body.description, location: body.location, start: { dateTime: body.start, timeZone: body.timeZone }, end: { dateTime: body.end, timeZone: body.timeZone } }) });
}

export async function PATCH(request: Request) {
  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
  return authorizedRequest(request, `${calendarBase}/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: JSON.stringify(await request.json()) });
}

export async function DELETE(request: Request) {
  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
  return authorizedRequest(request, `${calendarBase}/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}