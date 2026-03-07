import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Hazelnote",
  description: "Your AI Study Companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* CRITICAL: The AppProvider must wrap {children} here so the context is available to all pages */}
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}


