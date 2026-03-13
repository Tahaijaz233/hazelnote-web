import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

  if (API_KEYS.length === 0) {
    return NextResponse.json({ error: 'Server Configuration Error: Gemini API keys missing.' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: API_KEYS[0], apiKeys: API_KEYS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt, userText, audioBase64, audioMimeType, responseFormat, useSearch } = body;

    const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

    if (API_KEYS.length === 0) {
      return NextResponse.json({ error: 'Server Configuration Error: Gemini API keys missing.' }, { status: 500 });
    }

    const contents: any[] = [{ parts: [] }];
    let combinedText = systemPrompt || '';
    if (userText) combinedText += '\n\nCONTEXT:\n' + userText;
    
    if (combinedText) contents[0].parts.push({ text: combinedText });

    if (audioBase64 && audioMimeType) {
      contents[0].parts.push({
        inlineData: { mimeType: audioMimeType, data: audioBase64 }
      });
    }

    const payload: any = {
      contents,
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    };

    if (responseFormat === 'json') {
      payload.generationConfig.responseMimeType = "application/json";
    }

    if (useSearch) {
      payload.tools = [{ google_search: {} }];
    }

    let lastErrorMsg = '';

    for (const apiKey of API_KEYS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          const errMsg = data.error?.message || 'Gemini API Error';
          lastErrorMsg = errMsg;
          
          if (response.status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exceeded')) {
            console.warn(`Gemini API Key hit quota limit. Trying next key...`);
            continue;
          }
          
          return NextResponse.json({ error: errMsg }, { status: response.status });
        }

        return NextResponse.json({ result: data.candidates?.[0]?.content?.parts?.[0]?.text });

      } catch (err: any) {
        lastErrorMsg = err.message;
        console.warn(`Gemini Request Failed: ${lastErrorMsg}. Trying next key...`);
        continue;
      }
    }

    return NextResponse.json(
      { error: `All Gemini API keys exhausted. Last error: ${lastErrorMsg}` }, 
      { status: 429 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
