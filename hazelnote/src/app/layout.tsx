import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HazelNote | AI-Powered Study Workspace',
  description: 'Transform your notes into flashcards, quizzes, and podcasts with AI. Study smarter with HazelNote.',
  icons: {
    icon: '/hazelnote_favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
