import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';

// Read from environment variables ONLY. No hardcoded keys.
const RAW_YT_KEYS = process.env.YOUTUBE_TRANSCRIPT_API_KEYS || process.env.YOUTUBE_TRANSCRIPT_API_KEY || '';
// Split the string into an array of keys and remove any empty spaces
const YT_API_KEYS = RAW_YT_KEYS.split(',').map(k => k.trim()).filter(Boolean);

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
    // Failsafe: Check if keys actually exist in the environment
    if (YT_API_KEYS.length === 0) {
      return NextResponse.json(
        { error: 'Server Configuration Error: YouTube Transcript API keys are missing from environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    let lastError = null;

    // MULTI-KEY FALLBACK LOOP
    for (const apiKey of YT_API_KEYS) {
      try {
        const response = await fetch(YOUTUBE_TRANSCRIPT_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: [videoId],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          lastError = errorData?.message || `Transcript API error: ${response.status}`;
          console.warn(`YouTube API Key failed: ${lastError}. Trying next key...`);
          continue;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const transcriptResult = data[0];
          
          if (transcriptResult.error) {
            lastError = transcriptResult.error;
            continue; 
          }

          let fullText = '';
          
          if (transcriptResult.transcripts && Array.isArray(transcriptResult.transcripts)) {
            const transcript = transcriptResult.transcripts[0];
            if (transcript && Array.isArray(transcript.lines)) {
              fullText = transcript.lines.map((line: any) => line.text || '').join(' ');
            }
          } else if (transcriptResult.text) {
            fullText = transcriptResult.text;
          }

          if (!fullText || fullText.trim().length === 0) {
            return NextResponse.json(
              { error: 'No transcript available for this video' },
              { status: 404 }
            );
          }

          return NextResponse.json({
            text: fullText.trim(),
            source: 'YouTube',
            videoId: videoId,
            length: fullText.length,
          });
        }
      } catch (err: any) {
         lastError = err.message;
         console.warn(`YouTube API Fetch failed: ${lastError}. Trying next key...`);
         continue;
      }
    }

    return NextResponse.json(
      { error: `All YouTube API keys failed or no transcript found. Last error: ${lastError}` },
      { status: 404 }
    );

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