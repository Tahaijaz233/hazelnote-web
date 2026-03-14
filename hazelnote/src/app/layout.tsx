import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hazelnote - Your AI Study Companion',
  description: 'AI-powered study sets, flashcards, and tutoring.',
  icons: {
    // FIX 9: Favicon wasn't working. Pointing explicitly to the right asset.
    icon: '/hazelnote_favicon.png',
    shortcut: '/hazelnote_favicon.png',
    apple: '/hazelnote_favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // FIX 4: Completely remove white mode and implement dark mode throughout.
    // Enforcing 'dark' class permanently on the HTML wrapper.
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.className} bg-[#0f0f0f] text-white min-h-screen antialiased selection:bg-blue-500/30`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
