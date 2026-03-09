import { NextRequest, NextResponse } from 'next/server';

// YouTube Transcript API configuration
const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';
const YOUTUBE_TRANSCRIPT_API_KEY = process.env.YOUTUBE_TRANSCRIPT_API_KEY || '699abba587c753810a860b6d';

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

    // Call youtube-transcript.io API
    const response = await fetch(YOUTUBE_TRANSCRIPT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${YOUTUBE_TRANSCRIPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [videoId],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.message || `Transcript API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Parse the transcript response
    // The API returns an array of transcript results
    if (Array.isArray(data) && data.length > 0) {
      const transcriptResult = data[0];
      
      if (transcriptResult.error) {
        return NextResponse.json(
          { error: transcriptResult.error },
          { status: 400 }
        );
      }

      // Extract transcript text from the response
      // The API returns transcript items with text and timestamps
      let fullText = '';
      
      if (transcriptResult.transcripts && Array.isArray(transcriptResult.transcripts)) {
        // Get the first available transcript (usually English)
        const transcript = transcriptResult.transcripts[0];
        
        if (transcript && Array.isArray(transcript.lines)) {
          fullText = transcript.lines.map((line: any) => line.text || '').join(' ');
        }
      } else if (transcriptResult.text) {
        // Fallback if the response format is different
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

    return NextResponse.json(
      { error: 'No transcript found for this video' },
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
