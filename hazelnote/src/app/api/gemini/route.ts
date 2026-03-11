import { NextRequest, NextResponse } from 'next/server';

// Read from environment variables ONLY. No hardcoded keys.
const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
// Split the string into an array of keys and remove any empty spaces
const API_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 8192;

// Upload file to Gemini File API
async function uploadFileToGemini(fileBase64: string, mimeType: string, apiKey: string): Promise<{ uri: string; name: string } | null> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, 'base64');
    
    // Upload to Gemini File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('File upload failed:', errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.file && data.file.uri) {
      return {
        uri: data.file.uri,
        name: data.file.name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error uploading file to Gemini:', error);
    return null;
  }
}

// Delete file from Gemini File API
async function deleteFileFromGemini(fileName: string, apiKey: string): Promise<boolean> {
  try {
    const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('File deletion failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file from Gemini:', error);
    return false;
  }
}

// Wait for file to be active
async function waitForFileActive(fileName: string, apiKey: string, maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
      
      if (!response.ok) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      
      const data = await response.json();
      
      if (data.state === 'ACTIVE') {
        return true;
      }
      
      // Wait before next attempt
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error('Error checking file state:', error);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  let uploadedFileName: string | null = null;
  let usedApiKey: string | null = null;

  try {
    // Failsafe: Check if keys actually exist in the environment
    if (API_KEYS.length === 0) {
      return NextResponse.json(
        { error: 'Server Configuration Error: Gemini API keys are missing from environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { systemPrompt, userText, pdfBase64, mimeType, useFileApi, fileUri } = body;

    if (!systemPrompt && !userText && !pdfBase64 && !fileUri) {
      return NextResponse.json(
        { error: 'Missing prompt, text, PDF data, or file URI' },
        { status: 400 }
      );
    }

    const contents: any[] = [{ parts: [] }];

    // Handle text content
    if (systemPrompt || userText) {
      let combinedText = systemPrompt || '';
      if (userText) {
        combinedText += (systemPrompt ? '\n\n' : '') + 'CONTEXT:\n' + userText;
      }
      if (combinedText) {
        contents[0].parts.push({ text: combinedText });
      }
    }

    // Handle file content
    if (pdfBase64 && useFileApi) {
      // Use File API for larger files
      usedApiKey = API_KEYS[0];
      const fileInfo = await uploadFileToGemini(pdfBase64, mimeType || 'application/pdf', usedApiKey);
      
      if (!fileInfo) {
        return NextResponse.json(
          { error: 'Failed to upload file to Gemini File API' },
          { status: 500 }
        );
      }
      
      uploadedFileName = fileInfo.name;
      
      // Wait for file to be active
      const isActive = await waitForFileActive(fileInfo.name, usedApiKey);
      
      if (!isActive) {
        // Clean up the file if it didn't become active
        await deleteFileFromGemini(fileInfo.name, usedApiKey);
        return NextResponse.json(
          { error: 'File upload timed out. Please try again.' },
          { status: 500 }
        );
      }
      
      // Add file reference to contents
      contents[0].parts.push({
        file_data: {
          mime_type: mimeType || 'application/pdf',
          file_uri: fileInfo.uri,
        },
      });
    } else if (pdfBase64) {
      // Use inline data for smaller files (fallback)
      contents[0].parts.push({
        inline_data: {
          mime_type: mimeType || 'application/pdf',
          data: pdfBase64,
        },
      });
    } else if (fileUri) {
      // Use existing file URI
      contents[0].parts.push({
        file_data: {
          mime_type: mimeType || 'application/pdf',
          file_uri: fileUri,
        },
      });
    }

    if (!userText && !systemPrompt && !pdfBase64 && !fileUri) {
      contents[0].parts.push({
        text: 'Extract ALL readable text from this document using OCR. Return only the clean extracted text, no extra commentary.',
      });
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

        // Delete the uploaded file immediately after successful generation
        if (uploadedFileName && usedApiKey) {
          await deleteFileFromGemini(uploadedFileName, usedApiKey);
          console.log('File deleted from Gemini:', uploadedFileName);
        }

        return NextResponse.json({ result });

      } catch (err: any) {
        lastError = err.message;
        console.warn(`Gemini API Fetch failed: ${lastError}. Trying next key...`);
        continue;
      }
    }

    // Clean up file if all keys failed
    if (uploadedFileName && usedApiKey) {
      await deleteFileFromGemini(uploadedFileName, usedApiKey);
    }

    return NextResponse.json(
      { error: `All Gemini API keys failed. Last error: ${lastError}` },
      { status: 500 }
    );

  } catch (error: any) {
    // Clean up file on error
    if (uploadedFileName && usedApiKey) {
      await deleteFileFromGemini(uploadedFileName, usedApiKey);
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// New endpoint to delete a file from Gemini
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'Missing fileName parameter' },
        { status: 400 }
      );
    }

    if (API_KEYS.length === 0) {
      return NextResponse.json(
        { error: 'Server Configuration Error: Gemini API keys are missing.' },
        { status: 500 }
      );
    }

    const success = await deleteFileFromGemini(fileName, API_KEYS[0]);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
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
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
