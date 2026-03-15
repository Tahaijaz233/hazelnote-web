import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HazelNote",
  description: "Your AI Study Companion",
  icons: {
    icon: [{ url: "/hazelnote_favicon.png", type: "image/png" }],
    shortcut: [{ url: "/hazelnote_favicon.png", type: "image/png" }],
    apple: [{ url: "/hazelnote_favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Strictly enforcing dark mode on the HTML element
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="icon" type="image/png" href="/hazelnote_favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/hazelnote_favicon.png" />
        <link rel="apple-touch-icon" href="/hazelnote_favicon.png" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
