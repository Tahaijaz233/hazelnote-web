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
  
  let processedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    mathStore.push({ type: 'block', math });
    return `MATHBLOCK_${mathStore.length - 1}_END`;
  });
  
  processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    mathStore.push({ type: 'inline', math });
    return `MATHINLINE_${mathStore.length - 1}_END`;
  });
  
  let html = marked.parse(processedText) as string;
  
  html = html.replace(/MATHBLOCK_(\d+)_END/g, (_, i) => {
    try {
      return katex.renderToString(mathStore[parseInt(i)].math, { displayMode: true, throwOnError: false });
    } catch {
      return `$$${mathStore[parseInt(i)].math}$$`; 
    }
  });
  
  html = html.replace(/MATHINLINE_(\d+)_END/g, (_, i) => {
    try {
      return katex.renderToString(mathStore[parseInt(i)].math, { displayMode: false, throwOnError: false });
    } catch {
      return `$${mathStore[parseInt(i)].math}$`; 
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

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof window === 'undefined') return new ArrayBuffer(0);
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function pcmToWav(pcmData: ArrayBuffer, sampleRate = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmView = new Uint8Array(pcmData);
  new Uint8Array(buffer, 44).set(pcmView);

  return new Blob([buffer], { type: 'audio/wav' });
}
