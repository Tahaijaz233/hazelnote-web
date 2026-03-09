import { NextRequest, NextResponse } from 'next/server';

// Read from environment variables ONLY. No hardcoded keys.
const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
// Split the string into an array of keys and remove any empty spaces
const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 8192;

export async function POST(request: NextRequest) {
  try {
    // Failsafe: Check if keys actually exist in the environment
    if (API_KEYS.length === 0) {
      return NextResponse.json(
        { error: 'Server Configuration Error: Gemini API keys are missing from environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { systemPrompt, userText, pdfBase64, mimeType } = body;

    if (!systemPrompt && !userText && !pdfBase64) {
      return NextResponse.json(
        { error: 'Missing prompt, text or PDF data' },
        { status: 400 }
      );
    }

    const contents: any[] = [{ parts: [] }];

    if (systemPrompt || userText) {
      let combinedText = systemPrompt || '';
      if (userText) {
        combinedText += (systemPrompt ? '\n\n' : '') + 'CONTEXT:\n' + userText;
      }
      if (combinedText) {
        contents[0].parts.push({ text: combinedText });
      }
    }

    if (pdfBase64) {
      const mime = mimeType || 'application/pdf';
      contents[0].parts.push({
        inline_data: {
          mime_type: mime,
          data: pdfBase64,
        },
      });

      if (!userText && !systemPrompt) {
        contents[0].parts.push({
          text: 'Extract ALL readable text from this document using OCR. Return only the clean extracted text, no extra commentary.',
        });
      }
    }

    const payload = {
      contents,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      },
    };

    let lastError = null;

    // MULTI-KEY FALLBACK LOOP
    for (const apiKey of API_KEYS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          lastError = data.error?.message || `Gemini API rejected the request with status ${response.status}`;
          console.warn(`Gemini API Key failed: ${lastError}. Trying next key...`);
          continue; 
        }

        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!result) {
          lastError = 'Unexpected API response structure';
          continue;
        }

        return NextResponse.json({ result });

      } catch (err: any) {
        lastError = err.message;
        console.warn(`Gemini API Fetch failed: ${lastError}. Trying next key...`);
        continue;
      }
    }

    return NextResponse.json(
      { error: `All Gemini API keys failed. Last error: ${lastError}` },
      { status: 500 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}