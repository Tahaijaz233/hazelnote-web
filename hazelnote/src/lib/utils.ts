import { marked } from 'marked';

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
  
  const mathStore: string[] = [];
  
  // Store math blocks
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    mathStore.push(match);
    return `MATHBLOCK_${mathStore.length - 1}_END`;
  });
  
  // Store inline math
  text = text.replace(/\$([^$\n]+?)\$/g, (match) => {
    mathStore.push(match);
    return `MATHINLINE_${mathStore.length - 1}_END`;
  });
  
  // Parse markdown
  let html = marked.parse(text) as string;
  
  // Restore math blocks
  html = html.replace(/MATHBLOCK_(\d+)_END/g, (_, i) => mathStore[parseInt(i)]);
  html = html.replace(/MATHINLINE_(\d+)_END/g, (_, i) => mathStore[parseInt(i)]);
  
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
