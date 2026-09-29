import { NextResponse } from 'next/server';

interface BraveResult {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  profile?: { long_name?: string };
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ error: 'A search query is required.' }, { status: 400 });
  if (!process.env.WEB_SEARCH_API_KEY) return NextResponse.json({ error: 'Web research is not configured. Add WEB_SEARCH_API_KEY to the server environment.' }, { status: 503 });
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${new URLSearchParams({ q: query, count: '10', safesearch: 'moderate' })}`, { headers: { Accept: 'application/json', 'X-Subscription-Token': process.env.WEB_SEARCH_API_KEY }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return NextResponse.json({ error: 'Web search provider failed.' }, { status: response.status });
  const data = await response.json() as { web?: { results?: BraveResult[] } };
  const results = (data.web?.results || []).filter((item) => item.title && item.url).map((item) => ({ title: item.title!, url: item.url!, source: item.profile?.long_name || new URL(item.url!).hostname, date: item.age || null, snippet: item.description || '' }));
  return NextResponse.json({ success: true, query, results });
}