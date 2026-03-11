import { marked } from 'marked';
import katex from 'katex';

export function safeParseJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function renderMarkdownWithMath(text: string): string {
  if (!text) return '';
  
  const mathStore: { type: 'inline' | 'block', math: string }[] = [];
  
  // Store math blocks securely
  let processedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    mathStore.push({ type: 'block', math });
    return `MATHBLOCK_${mathStore.length - 1}_END`;
  });
  
  // Store inline math securely
  processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    mathStore.push({ type: 'inline', math });
    return `MATHINLINE_${mathStore.length - 1}_END`;
  });
  
  // Parse markdown
  let html = marked.parse(processedText) as string;
  
  // Restore and officially render math blocks using KaTeX
  html = html.replace(/MATHBLOCK_(\d+)_END/g, (_, i) => {
    try {
      return katex.renderToString(mathStore[parseInt(i)].math, { displayMode: true, throwOnError: false });
    } catch {
      return `$$${mathStore[parseInt(i)].math}$$`; // Fallback if KaTeX fails
    }
  });
  
  html = html.replace(/MATHINLINE_(\d+)_END/g, (_, i) => {
    try {
      return katex.renderToString(mathStore[parseInt(i)].math, { displayMode: false, throwOnError: false });
    } catch {
      return `$${mathStore[parseInt(i)].math}$`; // Fallback if KaTeX fails
    }
  });
  
  return html;
}

export function extractYouTubeVideoId(url: string): string | null {
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

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
