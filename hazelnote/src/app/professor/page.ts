'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Send, Paperclip, Sparkles, Bot, RefreshCw, AlertCircle,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeParseJSON, renderMarkdownWithMath } from '@/lib/utils';

type ChatMsg = { role: 'user' | 'ai'; text: string };

// ── Daily message usage helpers ──────────────────────────────────────────────
function getDailyMsgCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem('hz_chat_usage');
    if (!stored) return 0;
    const data = JSON.parse(stored);
    if (data.date !== new Date().toDateString()) return 0;
    return data.count || 0;
  } catch { return 0; }
}

function incrementDailyMsgCount(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toDateString();
  const count = getDailyMsgCount();
  localStorage.setItem('hz_chat_usage', JSON.stringify({ date: today, count: count + 1 }));
}

export default function ProfessorHazel() {
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'ai',
    text: `<b>Hello! I'm Professor Hazel, your personal AI tutor.</b><br/><br/>
I can help you with:
<ul style="list-style:disc;padding-left:1.2rem;margin-top:0.5rem;color:#CBD5E1;">
  <li>Creating personalised <b>study schedules</b></li>
  <li>Explaining topics if you share your notes</li>
  <li>Teaching powerful <b>mnemonics</b> and memory techniques</li>
  <li>Answering academic questions in any subject</li>
  <li>General study strategy & exam preparation advice</li>
</ul>
<br/>How can I help you today?`,
  }]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const dailyLimit = tier === 'pro' ? 10 : 2;
  const remaining = Math.max(0, dailyLimit - dailyCount);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'profiles', u.uid));
        if (snap.exists()) {
          const p = snap.data();
          setTier(p.is_pro ? 'pro' : 'free');
        }
      }
    });
    setDailyCount(getDailyMsgCount());
    return () => unsub();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callLLM = async (systemPrompt: string, userText: string, file?: File | null): Promise<string> => {
    if (file) {
      const keyRes = await fetch('/api/gemini');
      const keyData = await keyRes.json();
      const apiKeys: string[] = keyData.apiKeys || [keyData.apiKey];
      let lastErr = '';
      for (const apiKey of apiKeys) {
        const toCleanup: string[] = [];
        try {
          const up = await fetch(
            `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
            { method: 'POST', headers: { 'X-Goog-Upload-Protocol': 'raw', 'X-Goog-Upload-Header-Content-Type': file.type || 'application/pdf', 'Content-Type': file.type || 'application/pdf' }, body: file }
          );
          const upData = await up.json();
          if (!up.ok || !upData.file) throw new Error(upData.error?.message || 'Upload failed');
          toCleanup.push(upData.file.name);
          let state = upData.file.state;
          while (state === 'PROCESSING') {
            await new Promise(r => setTimeout(r, 3000));
            const chk = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/${upData.file.name}?key=${apiKey}`)).json();
            state = chk.state;
            if (state === 'FAILED') throw new Error('AI failed to process the file.');
          }
          const contents: any[] = [{ parts: [] }];
          contents[0].parts.push({ fileData: { mimeType: file.type || 'application/pdf', fileUri: `https://generativelanguage.googleapis.com/v1beta/${upData.file.name}` } });
          let combined = systemPrompt || '';
          if (userText) combined += '\n\n' + userText;
          if (combined) contents[0].parts.push({ text: combined });
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 8192, temperature: 0.7 } })
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || 'Gemini error');
          for (const n of toCleanup) { try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${n}?key=${apiKey}`, { method: 'DELETE' }); } catch { } }
          return data.candidates[0].content.parts[0].text;
        } catch (e: any) {
          lastErr = e.message;
          for (const n of toCleanup) { try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${n}?key=${apiKey}`, { method: 'DELETE' }); } catch { } }
          if (lastErr.toLowerCase().includes('quota') || lastErr.includes('429')) continue;
          throw e;
        }
      }
      throw new Error(`All API keys exhausted. Last error: ${lastErr}`);
    }
    const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemPrompt, userText }) });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || isSending) return;

    // Check daily limit
    const currentCount = getDailyMsgCount();
    if (currentCount >= dailyLimit) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `<span style="color:#FBBF24;">⚠️ <b>Daily message limit reached (${dailyLimit}/${dailyLimit}).</b> Your limit resets in 24 hours. ${tier === 'free' ? '<a href="/pricing/" style="color:#34D399;text-decoration:underline;">Upgrade to Pro</a> for 10 messages/day.' : ''}</span>`,
      }]);
      return;
    }

    const userText = input;
    const fileToSend = attachedFile;
    setInput('');
    setAttachedFile(null);
    setIsSending(true);

    const userMsg: ChatMsg = {
      role: 'user',
      text: userText + (fileToSend ? `<div style="margin-top:6px;font-size:0.75rem;color:#6EE7B7;font-weight:600;">📎 ${fileToSend.name}</div>` : ''),
    };
    setMessages(prev => [...prev, userMsg, { role: 'ai', text: '<span class="animate-pulse">Thinking...</span>' }]);

    incrementDailyMsgCount();
    setDailyCount(getDailyMsgCount());

    try {
      const systemPrompt = `You are Professor Hazel, a warm, encouraging, and expert AI tutor. You help students with:
- Creating detailed, realistic study schedules
- Explaining complex topics clearly with examples
- Teaching effective mnemonics and memory techniques
- Answering academic questions across all subjects
- Giving personalised exam preparation advice

Be thorough, encouraging, and use formatting (bold, lists) to make your responses clear. Always end with a follow-up question or actionable next step.`;

      const result = await callLLM(systemPrompt, userText, fileToSend);
      setMessages(prev => {
        const n = [...prev];
        n[n.length - 1] = { role: 'ai', text: renderMarkdownWithMath(result) };
        return n;
      });
    } catch (e: any) {
      setMessages(prev => {
        const n = [...prev];
        n[n.length - 1] = { role: 'ai', text: `<span style="color:#F87171;">Error: ${e.message}</span>` };
        return n;
      });
    }
    setIsSending(false);
  };

  const Sidebar = () => (
    <aside className={`w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-50 fixed md:sticky top-0 left-0 transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-white leading-none">HazelNote</h1>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">by free-ed</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace</div>
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Create Notes</Link>
        <Link href="/exam/" className="w-full text-left sidebar-item flex items-center gap-3"><ClipboardList className="w-5 h-5" /> Take an Exam</Link>
        <Link href="/professor/" className="w-full text-left sidebar-item active flex items-center gap-3"><Bot className="w-5 h-5" /> Professor Hazel</Link>
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-1">
        {tier === 'free' && (
          <div className="mb-2"><Link href="/pricing/" className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">⚡ Upgrade to Pro</Link></div>
        )}
        <Link href="/profile/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-400 hover:text-white"><UserCircle className="w-5 h-5" /> Profile & Settings</Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-400 hover:text-white"><HelpCircle className="w-5 h-5" /> Support</Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />}
      <Sidebar />

      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        {/* Desktop menu button */}
        <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2">
          <Menu className="w-5 h-5" /><span className="text-sm font-medium">Menu</span>
        </button>

        {/* Mobile header */}
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300 hover:bg-gray-800 rounded-lg"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" className="w-8 h-8 rounded-lg" />
            <span className="font-extrabold text-lg text-white">HazelNote</span>
          </div>
        </div>

        {/* Header bar */}
        <div className="shrink-0 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between md:pl-20">
          <div className="flex items-center gap-3">
            <img src="/hazelnote_tutor.png" className="w-11 h-11 rounded-full object-cover border-2 border-green-500 bg-green-900/30" />
            <div>
              <h2 className="font-extrabold text-white text-base leading-tight">Professor Hazel</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-400 font-bold">24/7 AI Tutor</span>
              </div>
            </div>
          </div>
          {/* Message limit indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${remaining === 0 ? 'bg-red-900/30 border-red-700 text-red-400' : remaining <= 1 ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {remaining}/{dailyLimit} messages today
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[90%] md:max-w-[75%] animate-slide-in ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              {msg.role === 'ai'
                ? <img src="/hazelnote_tutor.png" className="w-9 h-9 rounded-full flex-shrink-0 object-cover bg-white border border-green-500" />
                : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">{user?.displayName?.[0] || 'U'}</div>
              }
              <div className={`p-4 text-sm rounded-2xl leading-relaxed ${msg.role === 'ai' ? 'bg-gray-800 border border-gray-700 rounded-tl-sm text-gray-200' : 'bg-green-500 text-white rounded-tr-sm'}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Limit reached banner */}
        {remaining === 0 && (
          <div className="shrink-0 mx-4 mb-2 px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl flex items-center gap-2 text-red-400 text-sm font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Daily limit reached ({dailyLimit}/{dailyLimit}). Resets in 24 hours.{tier === 'free' ? ' ' : ''}</span>
            {tier === 'free' && <Link href="/pricing/" className="text-green-400 underline ml-1">Upgrade to Pro</Link>}
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md p-4">
          {attachedFile && (
            <div className="mb-3 flex items-center gap-2 bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs font-medium text-gray-300">
              <Paperclip className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="ml-auto text-red-400 hover:text-red-300 p-1 hover:bg-gray-700 rounded transition"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            {/* File upload — Pro only */}
            <div className="relative group">
              <input
                type="file"
                id="prof-attachment"
                className="hidden"
                accept="image/*,.pdf"
                onChange={e => {
                  if (tier !== 'pro') return;
                  setAttachedFile(e.target.files?.[0] || null);
                }}
              />
              <label
                htmlFor="prof-attachment"
                title={tier === 'pro' ? 'Attach file' : 'File upload is a Pro feature'}
                className={`p-3 rounded-xl flex items-center justify-center cursor-pointer transition ${tier === 'pro' ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'}`}
                onClick={e => { if (tier !== 'pro') { e.preventDefault(); alert('File attachment is a Pro feature. Upgrade to Pro to attach files to Professor Hazel.'); } }}
              >
                <Paperclip className="w-5 h-5" />
              </label>
              {tier !== 'pro' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">P</span>
                </span>
              )}
            </div>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
              disabled={remaining === 0}
              rows={1}
              className="flex-1 border border-gray-700 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
              placeholder={remaining === 0 ? 'Daily limit reached. Come back tomorrow.' : 'Ask Professor Hazel anything... (Shift+Enter for new line)'}
            />

            <button
              onClick={sendMessage}
              disabled={isSending || remaining === 0 || (!input.trim() && !attachedFile)}
              className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isSending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            {tier === 'free'
              ? `Free plan: ${remaining} message${remaining !== 1 ? 's' : ''} remaining today (shared with study set chats). `
              : `Pro plan: ${remaining} message${remaining !== 1 ? 's' : ''} remaining today. `}
            Shift+Enter for new line.
          </p>
        </div>
      </main>
    </div>
  );
}
