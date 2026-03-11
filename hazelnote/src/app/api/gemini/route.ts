import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Deliver the API key to the client for direct-to-Gemini massive file uploads.
  // This allows the browser to bypass Vercel's strict 4.5MB serverless payload limit!
  const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

  if (API_KEYS.length === 0) {
    return NextResponse.json({ error: 'Server Configuration Error: Gemini API keys missing.' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: API_KEYS[0] });
}

export async function POST(request: NextRequest) {
  try {
    // This handles lightweight text-only requests (Chats, Podcasts, Exams)
    // keeping the API key completely hidden on the server for standard requests.
    const body = await request.json();
    const { systemPrompt, userText } = body;

    const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

    if (API_KEYS.length === 0) {
      return NextResponse.json({ error: 'Server Configuration Error: Gemini API keys missing.' }, { status: 500 });
    }

    const contents: any[] = [{ parts: [] }];
    let combinedText = systemPrompt || '';
    if (userText) combinedText += '\n\nCONTEXT:\n' + userText;
    if (combinedText) contents[0].parts.push({ text: combinedText });

    const payload = {
      contents,
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    };

    const apiKey = API_KEYS[0];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || 'Gemini API Error' }, { status: response.status });
    }

    return NextResponse.json({ result: data.candidates?.[0]?.content?.parts?.[0]?.text });

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
