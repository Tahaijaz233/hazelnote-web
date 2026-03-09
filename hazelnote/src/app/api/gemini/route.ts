import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDQE66DWouG-T3qf3BhjQSEPgxbMMCzljk';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 8192;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt, userText, pdfBase64, mimeType } = body;

    if (!systemPrompt && !userText && !pdfBase64) {
      return NextResponse.json(
        { error: 'Missing prompt, text or PDF data' },
        { status: 400 }
      );
    }

    const contents: any[] = [{ parts: [] }];

    // Add system prompt and user text as a combined text part
    if (systemPrompt || userText) {
      let combinedText = systemPrompt || '';
      if (userText) {
        combinedText += (systemPrompt ? '\n\n' : '') + 'CONTEXT:\n' + userText;
      }
      if (combinedText) {
        contents[0].parts.push({ text: combinedText });
      }
    }

    // PDF/Image OCR (base64) - Gemini will process directly
    if (pdfBase64) {
      const mime = mimeType || 'application/pdf';
      contents[0].parts.push({
        inline_data: {
          mime_type: mime,
          data: pdfBase64,
        },
      });

      // If only file provided (no text), add OCR extraction prompt
      if (!userText && !systemPrompt) {
        contents[0].parts.push({
          text: 'Extract ALL readable text from this document using OCR. Return only the clean extracted text, no extra commentary.',
        });
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message || 'Gemini API rejected the request' },
        { status: response.status || 500 }
      );
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return NextResponse.json(
        { error: 'Unexpected API response structure' },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
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
