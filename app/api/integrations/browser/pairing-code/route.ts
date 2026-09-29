import { NextResponse } from 'next/server';
import { generateBrowserPairingCode, getPairedTokens } from '@/lib/integrations/browser-pairing';

export async function GET() {
  const code = generateBrowserPairingCode();
  const pairedCount = getPairedTokens().size;
  return NextResponse.json({
    pairingCode: code,
    expiresInSeconds: 300,
    pairedCount,
  });
}
