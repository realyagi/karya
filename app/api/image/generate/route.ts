import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface GenerateImageRequest {
  prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Image generation isn't configured yet.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const body: GenerateImageRequest = await req.json().catch(() => ({ prompt: '' }));
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a description of the image you want to create.',
        },
        { status: 400 }
      );
    }

    // Supported multimodal Gemini image generation models
    const candidateModels = [
      'gemini-2.5-flash-image',
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-image',
      'gemini-3-pro-image-preview',
      'gemini-3-pro-image',
      'gemini-3.1-flash-lite-image',
    ];

    let lastError: string | null = null;
    let isQuotaError = false;

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a high quality visual image of: ${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['IMAGE'],
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data?.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          for (const part of parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
              const mime = part.inlineData.mimeType;
              const base64 = part.inlineData.data;
              const imageUrl = `data:${mime};base64,${base64}`;

              return NextResponse.json({
                success: true,
                imageUrl,
                prompt,
                model: modelName,
              });
            }
          }
        } else {
          const errData = await response.json().catch(() => null);
          const errMsg = errData?.error?.message || response.statusText;

          if (response.status === 429 || errMsg.includes('Quota exceeded') || errMsg.includes('quota')) {
            isQuotaError = true;
            lastError = 'Gemini image generation quota exceeded for your project plan.';
          } else if (response.status === 400 && errMsg.includes('SAFETY')) {
            return NextResponse.json(
              {
                success: false,
                error: 'The image prompt was blocked by safety policies. Please try a different description.',
              },
              { status: 400 }
            );
          } else {
            lastError = errMsg;
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Network request failed';
      }
    }

    // If quota is exhausted or API call failed
    return NextResponse.json(
      {
        success: false,
        error: isQuotaError
          ? 'Gemini image generation quota exceeded. Please check your Gemini API plan.'
          : (lastError || 'Failed to generate image via Gemini.'),
        isQuotaError,
      },
      { status: isQuotaError ? 429 : 502 }
    );
  } catch (err: any) {
    console.error('[Image Generate Route Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected error occurred during image generation.',
      },
      { status: 500 }
    );
  }
}
