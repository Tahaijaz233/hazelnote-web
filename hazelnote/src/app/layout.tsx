import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HazelNote",
  description: "HazelNote Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inject jQuery first as Freemius requires it to build the FS object */}
        <Script 
          src="https://code.jquery.com/jquery-3.7.1.min.js" 
          strategy="beforeInteractive" 
        />
        {/* Inject the Freemius Checkout script after jQuery is ready */}
        <Script 
          src="https://checkout.freemius.com/checkout.min.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
