"use client";

import { ThemeProvider } from "next-themes";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';

interface GenContextType {
  bgGenActive: boolean;
  setBgGenActive: (val: boolean) => void;
  bgGenDone: boolean;
  setBgGenDone: (val: boolean) => void;
}

export const GenContext = createContext<GenContextType>({
  bgGenActive: false,
  setBgGenActive: () => {},
  bgGenDone: false,
  setBgGenDone: () => {},
});

export function Providers({ children }: { children: ReactNode }) {
  const [bgGenActive, setBgGenActive] = useState(false);
  const [bgGenDone, setBgGenDone] = useState(false);

  useEffect(() => {
    if (bgGenDone) {
      const timer = setTimeout(() => setBgGenDone(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [bgGenDone]);

  return (
    // Completely disabling light mode by forcing dark theme
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <GenContext.Provider value={{ bgGenActive, setBgGenActive, bgGenDone, setBgGenDone }}>
        {children}
        {bgGenDone && (
          <div className="fixed bottom-6 right-6 z-[100] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
            <Sparkles className="w-5 h-5"/>
            <div>
              <p className="font-bold text-sm">Study set ready!</p>
              <p className="text-xs text-green-100">Check your Dashboard to open it.</p>
            </div>
            <button onClick={() => setBgGenDone(false)} className="ml-2 text-green-200 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
        )}
        {bgGenActive && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
            <RefreshCw className="w-5 h-5 animate-spin"/>
            <span className="font-bold text-sm">Generating study set in background…</span>
          </div>
        )}
      </GenContext.Provider>
    </ThemeProvider>
  );
}

export const useGenContext = () => useContext(GenContext);
