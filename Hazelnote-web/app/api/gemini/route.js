import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { systemPrompt, userText, pdfBase64, mimeType } = body;
        
        // Construct the Gemini payload similar to your PHP script
        const contents = [{ parts: [] }];
        if (systemPrompt || userText) {
            contents[0].parts.push({ text: `${systemPrompt}\n\nCONTEXT:\n${userText}` });
        }
        if (pdfBase64) {
            contents[0].parts.push({
                inline_data: { mime_type: mimeType || 'application/pdf', data: pdfBase64 }
            });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return NextResponse.json({ error: data.error?.message || "API Error" }, { status: response.status });
        }

        return NextResponse.json({ result: data.candidates[0].content.parts[0].text });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}