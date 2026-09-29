import { NextResponse } from 'next/server';
import { validateBrowserPairingCode } from '@/lib/integrations/browser-pairing';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { pairingCode?: string };
    if (!body?.pairingCode) {
      return NextResponse.json({ error: 'pairingCode is required.' }, { status: 400 });
    }

    const token = validateBrowserPairingCode(body.pairingCode);
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid or expired pairing code. Please generate a new code in KARYA Settings.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authToken: token,
      message: 'Browser extension paired successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
