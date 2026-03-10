# HazelNote - Next.js Version

This is the Next.js version of HazelNote, an AI-powered study workspace.

## Features

- **AI-Powered Study Sets**: Transform PDFs, voice notes, and YouTube videos into flashcards, quizzes, and podcasts
- **YouTube Transcript Integration**: Uses youtube-transcript.io API to fetch video transcripts
- **Firebase Authentication**: Google sign-in and email/password authentication
- **Interactive Flashcards**: Flip cards with questions and answers
- **Practice Quizzes**: Multiple choice questions with instant feedback
- **AI Podcasts**: Text-to-speech for studying on-the-go
- **24/7 AI Tutor**: Chat with Professor Hazel for study help
- **Translation**: Translate notes to multiple languages
- **Dark Mode**: Full dark mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI**: Google Gemini API
- **Icons**: Lucide React

## Project Structure

```
hazelnote/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   │   ├── gemini/        # Gemini AI proxy
│   │   │   ├── youtube/       # YouTube transcript API
│   │   │   └── scrape/        # Web scraping API
│   │   ├── dashboard/         # Main dashboard with study set creation
│   │   ├── exam/              # Exam generation page
│   │   ├── login/             # Authentication page
│   │   ├── pricing/           # Pricing page
│   │   ├── profile/           # User profile and settings
│   │   ├── support/           # Support and FAQ page
│   │   ├── privacy-policy/    # Privacy policy
│   │   ├── terms-of-service/  # Terms of service
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── lib/                   # Utility functions
│   │   ├── firebase.ts        # Firebase configuration
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript types
│       └── index.ts           # Type definitions
├── public/                    # Static assets
│   ├── hazelnote_favicon.png
│   ├── hazelnote_logo.png
│   └── hazelnote_tutor.png
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── next-env.d.ts
```

## Getting Started

### 1. Install Dependencies

```bash
cd hazelnote
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
```

The static export will be generated in the `dist` folder.

## Deploying to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Option 2: Using GitHub Integration

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Add the environment variables in Vercel dashboard
4. Deploy

### Important Notes for Deployment

1. **Environment Variables**: Make sure to add all environment variables in the Vercel dashboard under Project Settings > Environment Variables.

2. **Firebase Auth Domain**: Add your Vercel deployment domain to the authorized domains in Firebase Console > Authentication > Settings > Authorized domains.

3. **API Routes**: The API routes (`/api/gemini`, `/api/youtube`, `/api/scrape`) are serverless functions that will work automatically on Vercel.

## YouTube Transcript API Integration

The YouTube transcript functionality uses the youtube-transcript.io API. The API key is already configured in the `/api/youtube/route.ts` file.

To fetch a YouTube transcript:
1. Paste a YouTube URL in the "Web / YouTube" input field
2. Click "Extract Text"
3. The transcript will be fetched and displayed in the text area

## API Routes

### `/api/gemini`
Proxy for Google Gemini AI API. Accepts POST requests with:
- `systemPrompt`: System instruction for the AI
- `userText`: User input text
- `pdfBase64`: (Optional) Base64-encoded PDF for OCR
- `mimeType`: (Optional) MIME type of the file

### `/api/youtube`
Fetches YouTube video transcripts using youtube-transcript.io API. Accepts POST requests with:
- `url`: YouTube video URL

### `/api/scrape`
Scrapes text content from web pages. Accepts POST requests with:
- `url`: Web page URL

## License

© 2026 HazelNote by free-ed. All rights reserved.
