'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, Plus } from 'lucide-react';

interface CalendarEvent { id: string; summary?: string; htmlLink?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }

export function CalendarPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState('Checking Google Calendar connection...');
  const [summary, setSummary] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    const statusResponse = await fetch('/api/integrations/google/status', { cache: 'no-store' });
    const status = await statusResponse.json() as { status?: string; message?: string };
    if (status.status !== 'connected') { setConnected(false); setMessage(status.message || 'Connect Google Calendar to read events.'); return; }
    setConnected(true);
    const response = await fetch('/api/integrations/google/calendar', { cache: 'no-store' });
    const data = await response.json() as { data?: { items?: CalendarEvent[] }; error?: string };
    if (!response.ok) { setMessage(data.error || 'I could not reach your calendar.'); return; }
    setEvents(data.data?.items || []);
    setMessage('Today\'s events');
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const createEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/integrations/google/calendar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary, start: new Date(start).toISOString(), end: new Date(end).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setMessage(data.error || 'Calendar event creation failed.'); return; }
    setSummary(''); setStart(''); setEnd(''); setMessage('Calendar confirmed the event.'); await load();
  };

  return <div className="mx-auto w-full max-w-5xl space-y-5 px-2 py-6"><section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Calendar</p><h2 className="mt-1 text-2xl font-semibold text-white">Google Calendar</h2></div><CalendarDays className="h-6 w-6 text-indigo-300" /></div>{connected === false ? <><p className="mt-4 text-sm text-slate-400">{message}</p><a href="/api/integrations/google/authorize" className="mt-4 inline-flex rounded-lg bg-indigo-500/20 px-4 py-2 text-sm text-indigo-100">Connect Google Calendar</a></> : <><p role="status" className="mt-4 text-xs text-slate-400">{message}</p><div className="mt-4 space-y-2">{events.length ? events.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 p-3"><span className="text-sm text-white">{item.summary || 'Untitled event'}</span>{item.htmlLink && <a href={item.htmlLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 text-slate-500" /></a>}</div>) : <p className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-slate-500">No events returned for today.</p>}</div><form onSubmit={createEvent} className="mt-5 grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]"><input required value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Event title" className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" /><input required type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" /><input required type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white" /><button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-sm text-indigo-100"><Plus className="h-4 w-4" />Add</button></form></>}</section></div>;
}