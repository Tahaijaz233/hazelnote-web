'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Send, Paperclip, Bot, Sparkles, AlertCircle
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { renderMarkdownWithMath } from '@/lib/utils';
import { UserProfile } from '@/types';

export default function ProfessorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  
  const [chatMessages, setChatMessages] = useState<{role:'user'|'ai';text:string}[]>([
    { role: 'ai', text: "Hello! I am Professor Hazel. I can help you create study schedules, clarify difficult topics with your uploaded notes, come up with mnemonics, and offer general academic support. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatFile, setChatFile] = useState<File|null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'profiles', u.uid));
        if (snap.exists()) {
          const p = snap.data() as UserProfile;
          setProfile(p);
          setTier(p.is_pro ? 'pro' : 'free');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const checkChatLimit = async () => {
    const limit = tier === 'pro' ? 10 : 2;
    const today = new Date().toISOString().split('T')[0];
    let currentStats = profile?.chat_stats || { date: today, count: 0 };
    
    if (currentStats.date !== today) {
      currentStats = { date: today, count: 0 };
    }
    
    if (currentStats.count >= limit) {
      alert(`Message limit reached! You can only send ${limit} messages to Professor Hazel per day on the ${tier === 'pro' ? 'Pro' : 'Free'} plan. Limit resets in 24 hours.`);
      return false;
    }
    
    currentStats.count += 1;
    setProfile(prev => prev ? { ...prev, chat_stats: currentStats } : prev);
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), { chat_stats: currentStats });
      } catch(e) {}
    }
    return true;
  };

  const callLLM = async (systemPrompt:string, userText:string, files?:File[]) => {
    if (files && files.length > 0) {
      const keyRes = await fetch('/api/gemini');
      const keyData = await keyRes.json();
      if (keyData.error||(!keyData.apiKeys&&!keyData.apiKey)) throw new Error('Could not retrieve Gemini API keys');
      const apiKeys = keyData.apiKeys||[keyData.apiKey];
      let lastErrorMsg = '';
      for (const apiKey of apiKeys) {
        const toCleanup:string[] = [];
        try {
          for (const file of files) {
            const up = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,{
              method:'POST',headers:{'X-Goog-Upload-Protocol':'raw','X-Goog-Upload-Header-Content-Type':file.type||'application/pdf','Content-Type':file.type||'application/pdf'},body:file});
            const upData = await up.json();
            if (!up.ok||!upData.file) throw new Error(upData.error?.message||'Upload failed');
            toCleanup.push(upData.file.name);
            let state = upData.file.state;
            while (state==='PROCESSING') {
              await new Promise(r=>setTimeout(r,3000));
              const chk = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/${upData.file.name}?key=${apiKey}`)).json();
              state = chk.state;
              if (state==='FAILED') throw new Error('AI failed to process the document.');
            }
          }
          const contents:any[] = [{parts:[]}];
          toCleanup.forEach(n=>contents[0].parts.push({fileData:{mimeType:'application/pdf',fileUri:`https://generativelanguage.googleapis.com/v1beta/${n}`}}));
          let combinedText = systemPrompt||'';
          if (userText) combinedText += '\n\nCONTEXT:\n'+userText;
          if (combinedText) contents[0].parts.push({text:combinedText});
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents,generationConfig:{maxOutputTokens:8192,temperature:0.7}})});
          const data = await res.json();
          if (!res.ok||data.error) throw new Error(data.error?.message||'Gemini API Error');
          for (const n of toCleanup) { try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${n}?key=${apiKey}`,{method:'DELETE'}); } catch(e){} }
          return data.candidates[0].content.parts[0].text;
        } catch(e:any) {
          lastErrorMsg = e.message;
          for (const n of toCleanup) { try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${n}?key=${apiKey}`,{method:'DELETE'}); } catch(ce){} }
          if (lastErrorMsg.toLowerCase().includes('quota')||lastErrorMsg.includes('429')) continue;
          else throw e;
        }
      }
      throw new Error(`All API keys exhausted. Last error: ${lastErrorMsg}`);
    }
    const res = await fetch('/api/gemini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemPrompt,userText})});
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatFile) return;
    
    if (!(await checkChatLimit())) return;

    const text = chatInput;
    const fileToSend = chatFile;
    setChatInput('');
    setChatFile(null);
    setIsTyping(true);
    
    setChatMessages(prev => [...prev, {
      role: 'user', 
      text: text + (fileToSend ? `<div class="text-xs text-green-300 mt-2 font-medium bg-gray-800 p-2 rounded-lg inline-flex items-center gap-1"><Paperclip className="w-3 h-3"/> ${fileToSend.name}</div>` : '')
    }]);

    try {
      const prompt = `You are Professor Hazel, a helpful, encouraging, and highly knowledgeable AI academic tutor. Your goal is to help students create study schedules, understand difficult topics using the notes they provide, create memory mnemonics, and offer general academic help. Keep your answers extremely clear, well-structured (use bolding and lists), and engaging.`;
      
      const response = await callLLM(prompt, text, fileToSend ? [fileToSend] : undefined);
      
      setChatMessages(prev => [...prev, { role: 'ai', text: renderMarkdownWithMath(response) }]);
    } catch(e:any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `<span class="text-red-500">Error: ${e.message}</span>` }]);
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const Sidebar = () => (
    <aside className={`w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full z-50 fixed md:sticky top-0 left-0 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white leading-none">HazelNote</h1>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">by free-ed</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition dark:text-gray-400 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
      </div>
      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
        <Link href="/dashboard/#create" className="w-full text-left sidebar-item flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Create Notes</Link>
        <Link href="/exam/" className="w-full text-left sidebar-item flex items-center gap-3"><ClipboardList className="w-5 h-5" /> Take an Exam</Link>
        <Link href="/professor/" className="w-full text-left sidebar-item active flex items-center gap-3"><Bot className="w-5 h-5" /> Professor Hazel</Link>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {tier === 'free' && <div className="mb-2"><Link href="/pricing/" className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">⚡ Upgrade to Pro</Link></div>}
        <Link href="/profile/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><UserCircle className="w-5 h-5" /> Profile & Settings</Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><HelpCircle className="w-5 h-5" /> Support</Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />}
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative">
        <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2">
          <Menu className="w-5 h-5" /><span className="text-sm font-medium">Menu</span>
        </button>
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-lg text-gray-900 dark:text-white">HazelNote</span>
          </div>
        </div>

        {/* Chat Header */}
        <div className="px-6 py-4 md:pt-10 md:px-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="/hazelnote_tutor.png" className="w-14 h-14 rounded-full object-cover border-2 border-green-500 bg-green-900/30" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">Professor Hazel</h2>
              <p className="text-xs font-bold text-green-500">Active • AI Academic Tutor</p>
            </div>
          </div>
          <div className="hidden sm:flex text-xs font-bold text-gray-500 dark:text-gray-400 items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
            <Bot className="w-4 h-4"/> 
            {tier === 'pro' ? 'Pro Plan: 10 chats/day' : 'Free Plan: 2 chats/day'}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-4 max-w-[90%] animate-slide-in ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? (
                  <img src="/hazelnote_tutor.png" className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-white shadow-md border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className={`p-4 md:p-5 text-[15px] rounded-2xl shadow-sm ${
                  msg.role === 'ai' 
                  ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none' 
                  : 'bg-[#10B981] text-white rounded-tr-sm'
                }`} dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 max-w-[90%] animate-slide-in">
                <img src="/hazelnote_tutor.png" className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-white shadow-md border border-gray-200 dark:border-gray-700" />
                <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay:'0s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto w-full">
            {chatFile && (
              <div className="mb-3 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 w-fit border border-gray-200 dark:border-gray-700">
                <Paperclip className="w-4 h-4 text-green-500"/>
                <span className="truncate max-w-[200px]">{chatFile.name}</span>
                <button onClick={() => setChatFile(null)} className="ml-1 text-gray-400 hover:text-red-500 transition">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <input 
                type="file" 
                id="prof-chat-attachment" 
                className="hidden" 
                accept="image/*,.pdf" 
                onChange={e => {
                  if (tier === 'free') {
                    alert('Attaching files to Professor Hazel is a Pro feature.');
                    return;
                  }
                  setChatFile(e.target.files?.[0] || null);
                }} 
              />
              <label 
                htmlFor="prof-chat-attachment" 
                className={`p-3.5 rounded-2xl cursor-pointer transition border shadow-sm flex-shrink-0 ${tier === 'pro' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 border-gray-100 dark:border-gray-800 opacity-60'}`}
                title={tier === 'free' ? 'Upgrade to Pro to attach files' : 'Attach file'}
              >
                <Paperclip className="w-5 h-5"/>
              </label>
              
              <div className="flex-1 relative">
                <textarea 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={handleKeyDown}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 pr-14 text-[15px] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none shadow-sm" 
                  placeholder="Ask a question, request a schedule, or share a topic..."
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
                <button 
                  onClick={sendChatMessage}
                  disabled={isTyping || (!chatInput.trim() && !chatFile)}
                  className="absolute right-2 bottom-2 bg-green-500 text-white p-2.5 rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-4 h-4"/>
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium flex items-center justify-center gap-1.5">
               Professor Hazel may produce inaccurate information. Please double check facts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
