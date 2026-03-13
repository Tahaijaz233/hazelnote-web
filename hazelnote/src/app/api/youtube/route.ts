import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';

const RAW_YT_KEYS = process.env.YOUTUBE_TRANSCRIPT_API_KEYS || process.env.YOUTUBE_TRANSCRIPT_API_KEY || '';
const YT_API_KEYS = RAW_YT_KEYS.split(',').map(k => k.trim()).filter(Boolean);

const RAW_GEMINI_KEYS = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const GEMINI_KEYS = RAW_GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    let fullText = '';
    let lastError = null;

    // PRIMARY: Try YouTube Transcript IO keys
    if (YT_API_KEYS.length > 0) {
      for (const apiKey of YT_API_KEYS) {
        try {
          const response = await fetch(YOUTUBE_TRANSCRIPT_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: [videoId] }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            lastError = errorData?.message || `Transcript API error: ${response.status}`;
            continue;
          }

          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const transcriptResult = data[0];
            
            if (transcriptResult.error) {
              lastError = transcriptResult.error;
              continue; 
            }

            if (transcriptResult.transcripts && Array.isArray(transcriptResult.transcripts)) {
              const transcript = transcriptResult.transcripts[0];
              if (transcript && Array.isArray(transcript.lines)) {
                fullText = transcript.lines.map((line: any) => line.text || '').join(' ');
              }
            } else if (transcriptResult.text) {
              fullText = transcriptResult.text;
            }

            if (fullText && fullText.trim().length > 0) break; // Success
          }
        } catch (err: any) {
           lastError = err.message;
           continue;
        }
      }
    }

    // FALLBACK: If transcript API completely fails or no keys exist, use Gemini Web Search
    if ((!fullText || fullText.trim().length === 0) && GEMINI_KEYS.length > 0) {
      console.warn('Transcript extraction failed. Falling back to Gemini Web Search to summarize video.');
      for (const geminiKey of GEMINI_KEYS) {
        try {
          const payload = {
            contents: [{ parts: [{ text: `Extract the transcript, or summarize in extremely deep detail all facts, spoken content, and main points of this YouTube video: ${url}` }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.2 }
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            fullText = "AI Extracted Video Summary:\n" + data.candidates[0].content.parts[0].text;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        { error: `No transcript available and web search fallback failed. Last error: ${lastError}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      text: fullText.trim(),
      source: 'YouTube',
      videoId: videoId,
      length: fullText.length,
    });

  } catch (error: any) {
    console.error('YouTube transcript error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transcript' },
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
