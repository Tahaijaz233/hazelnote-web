import { NextRequest, NextResponse } from 'next/server';

// Read from environment variables ONLY. No hardcoded keys.
const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 8192;

export async function POST(request: NextRequest) {
  try {
    if (API_KEYS.length === 0) {
      return NextResponse.json({ error: 'Server Configuration Error: Gemini API keys missing.' }, { status: 500 });
    }

    const body = await request.json();
    const { systemPrompt, userText, pdfUrls } = body;

    if (!systemPrompt && !userText && (!pdfUrls || pdfUrls.length === 0)) {
      return NextResponse.json({ error: 'Missing prompt, text or PDF data' }, { status: 400 });
    }

    // Step 1: Pre-download files from Firebase Storage into memory
    let downloadedFiles: { buffer: ArrayBuffer, mimeType: string, name: string }[] = [];
    if (pdfUrls && pdfUrls.length > 0) {
      for (let i = 0; i < pdfUrls.length; i++) {
        const res = await fetch(pdfUrls[i]);
        if (!res.ok) throw new Error("Failed to retrieve file from secure storage");
        const buffer = await res.arrayBuffer();
        downloadedFiles.push({
          buffer,
          mimeType: res.headers.get('content-type') || 'application/pdf',
          name: `document_${i}.pdf`
        });
      }
    }

    let lastError = null;

    // MULTI-KEY FALLBACK LOOP
    for (const apiKey of API_KEYS) {
      try {
        let fileUris = [];
        let uploadFailed = false;

        // Step 2: Upload files to Gemini File API using current key
        if (downloadedFiles.length > 0) {
          for (const file of downloadedFiles) {
            const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'X-Goog-Upload-Protocol': 'raw',
                'X-Goog-Upload-Header-Content-Type': file.mimeType,
                'Content-Type': file.mimeType,
              },
              body: file.buffer
            });

            const uploadData = await uploadRes.json();
            
            if (!uploadRes.ok || !uploadData.file?.uri) {
              uploadFailed = true;
              lastError = uploadData.error?.message || "Gemini File Upload Failed";
              break;
            }
            fileUris.push({ uri: uploadData.file.uri, mimeType: file.mimeType });
          }
        }

        if (uploadFailed) {
          console.warn(`Gemini API Key failed during file upload: ${lastError}. Trying next key...`);
          continue;
        }

        // Step 3: Build contents payload
        const contents: any[] = [{ parts: [] }];
        
        for (const f of fileUris) {
          contents[0].parts.push({
            fileData: { mimeType: f.mimeType, fileUri: f.uri }
          });
        }

        if (systemPrompt || userText) {
          let combinedText = systemPrompt || '';
          if (userText) combinedText += (systemPrompt ? '\n\n' : '') + 'CONTEXT:\n' + userText;
          if (combinedText) contents[0].parts.push({ text: combinedText });
        } else if (fileUris.length > 0) {
          contents[0].parts.push({ text: 'Extract ALL readable text from this document using OCR. Return only the clean extracted text, no extra commentary.' });
        }

        const payload = {
          contents,
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.7,
          },
        };

        // Step 4: Generate Content
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          lastError = `Invalid JSON from Gemini. Status ${response.status}.`;
          continue;
        }

        if (!response.ok || data.error) {
          lastError = data.error?.message || `API rejected request with status ${response.status}`;
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
