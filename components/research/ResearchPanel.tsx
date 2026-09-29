'use client';

import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

interface ResearchResult { title: string; url: string; source: string; date: string | null; snippet: string }

export function ResearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [message, setMessage] = useState('Search current web information with cited sources.');
  const [loading, setLoading] = useState(false);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('Searching current sources...');
    try {
      const response = await fetch(`/api/research/search?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
      const data = await response.json() as { error?: string; results?: ResearchResult[] };
      if (!response.ok) { setResults([]); setMessage(data.error || 'Web search failed.'); return; }
      setResults(data.results || []);
      setMessage(data.results?.length ? `${data.results.length} sources found.` : 'No sources found.');
    } catch {
      setResults([]);
      setMessage('I could not reach web search right now.');
    } finally { setLoading(false); }
  };

  return <div className="mx-auto w-full max-w-5xl space-y-5 px-2 py-6"><section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5"><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Research</p><h2 className="mt-1 text-2xl font-semibold text-white">Current web research</h2><form onSubmit={search} className="mt-5 flex gap-2"><label className="sr-only" htmlFor="research-query">Search query</label><input id="research-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Latest AI announcements" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60" /><button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-100 disabled:opacity-50"><Search className="h-4 w-4" />{loading ? 'Searching' : 'Search'}</button></form><p role="status" className="mt-3 text-xs text-slate-400">{message}</p></section><div className="space-y-3">{results.map((result) => <article key={result.url} className="rounded-xl border border-white/10 bg-slate-900/30 p-4"><a href={result.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium text-white">{result.title}</h3><p className="mt-1 text-[11px] text-cyan-300">{result.source}{result.date ? ` · ${result.date}` : ''}</p></div><ExternalLink className="h-4 w-4 shrink-0 text-slate-500" /></a><p className="mt-2 text-xs leading-relaxed text-slate-400">{result.snippet}</p></article>)}</div></div>;
}