import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ASSEMBLYAI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const tokenUrl = 'https://agents.assemblyai.com/v1/token?expires_in_seconds=600';
    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Token Route] AssemblyAI token generation failed:', response.status, errorText);
      return NextResponse.json(
        { error: `AssemblyAI rejected token request (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.token) {
      return NextResponse.json(
        { error: 'Invalid response from AssemblyAI token endpoint.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: data.token,
      expires_in_seconds: data.expires_in_seconds || 600,
    });
  } catch (error: unknown) {
    console.error('[Token Route] Unexpected error during token retrieval:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
