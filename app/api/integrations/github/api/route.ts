import { NextResponse } from 'next/server';
import { decryptTokenSet, oauthCookieName } from '@/lib/integrations/session';

const allowedActions = new Set(['repositories', 'issues', 'pulls', 'commits']);

async function getGitHubAccessToken(request: Request): Promise<string | null> {
  const cookie = request.headers.get('cookie')?.split('; ').find((part) => part.startsWith(`${oauthCookieName('github')}=`))?.split('=')[1];
  return cookie ? decryptTokenSet(cookie)?.accessToken || null : null;
}

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get('action') || 'repositories';
  if (!allowedActions.has(action)) return NextResponse.json({ error: 'Unsupported GitHub action.' }, { status: 400 });
  const accessToken = await getGitHubAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: 'GitHub is not connected.' }, { status: 401 });
  const endpoint = action === 'repositories' ? 'https://api.github.com/user/repos?sort=updated&per_page=50' : action === 'issues' ? 'https://api.github.com/issues?filter=assigned&state=open&per_page=50' : action === 'pulls' ? 'https://api.github.com/pulls?state=open&per_page=50' : 'https://api.github.com/user/repos?sort=updated&per_page=10';
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' });
  if (!response.ok) return NextResponse.json({ error: 'GitHub API request failed.' }, { status: response.status });
  return NextResponse.json({ success: true, action, data: await response.json() });
}

export async function POST(request: Request) {
  const accessToken = await getGitHubAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: 'GitHub is not connected.' }, { status: 401 });
  const body = await request.json() as { owner?: string; repo?: string; title?: string; body?: string; labels?: string[] };
  if (!body.owner || !body.repo || !body.title) return NextResponse.json({ error: 'owner, repo, and title are required.' }, { status: 400 });
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(body.owner)}/${encodeURIComponent(body.repo)}/issues`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ title: body.title, body: body.body, labels: body.labels }), cache: 'no-store' });
  if (!response.ok) return NextResponse.json({ error: 'GitHub issue creation failed.' }, { status: response.status });
  return NextResponse.json({ success: true, data: await response.json() });
}

export async function PATCH(request: Request) {
  const accessToken = await getGitHubAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: 'GitHub is not connected.' }, { status: 401 });
  const body = await request.json() as { owner?: string; repo?: string; issueNumber?: number; title?: string; body?: string; state?: 'open' | 'closed' };
  if (!body.owner || !body.repo || !body.issueNumber) return NextResponse.json({ error: 'owner, repo, and issueNumber are required.' }, { status: 400 });
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(body.owner)}/${encodeURIComponent(body.repo)}/issues/${body.issueNumber}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ title: body.title, body: body.body, state: body.state }), cache: 'no-store' });
  if (!response.ok) return NextResponse.json({ error: 'GitHub issue update failed.' }, { status: response.status });
  return NextResponse.json({ success: true, data: await response.json() });
}