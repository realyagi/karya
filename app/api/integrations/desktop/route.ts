import { NextResponse } from 'next/server';

const DESKTOP_BRIDGE_URL = 'http://127.0.0.1:48123';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'status') {
      const response = await fetch(`${DESKTOP_BRIDGE_URL}/status`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) {
        return NextResponse.json({ status: 'unavailable', error: 'Bridge returned non-200' }, { status: 502 });
      }
      const data = await response.json();
      return NextResponse.json({ status: 'running', data });
    }

    if (action === 'pairing-code') {
      const response = await fetch(`${DESKTOP_BRIDGE_URL}/pairing-code`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to obtain pairing code from bridge.' }, { status: 502 });
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Action parameter required.' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'unavailable',
      error: 'Desktop bridge service is not running on 127.0.0.1:48123.',
    }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'pair') {
      const response = await fetch(`${DESKTOP_BRIDGE_URL}/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: body.pairingCode }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    if (action === 'command') {
      const response = await fetch(`${DESKTOP_BRIDGE_URL}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: body.requestId || `call-${Date.now()}`,
          command: body.command,
          arguments: body.arguments || {},
          authToken: body.authToken,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    if (action === 'disconnect') {
      const response = await fetch(`${DESKTOP_BRIDGE_URL}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000),
      });
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      error: `Desktop bridge communication error: ${msg}. Is the desktop bridge running?`,
    }, { status: 503 });
  }
}
