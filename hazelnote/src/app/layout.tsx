import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
      </head>
      <body className="antialiased bg-[#0F172A]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
