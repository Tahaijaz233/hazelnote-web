'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Send, Paperclip, Bot, Sparkles, MessageSquarePlus, Clock, ChevronRight
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { renderMarkdownWithMath, safeParseJSON, saveToStorage } from '@/lib/utils';
import { UserProfile } from '@/types';

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: {role:'user'|'ai'; text:string}[];
}

export default function ProfessorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showChatLog, setShowChatLog] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const [chatMessages, setChatMessages] = useState<{role:'user'|'ai';text:string}[]>([
    { role: 'ai', text: "Hello! I am Professor Hazel. I can help you create study schedules, clarify difficult topics with your uploaded notes, come up with mnemonics, and offer general academic support. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatFile, setChatFile] = useState<File|null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = safeParseJSON<ChatSession[]>('hz_prof_chats', []);
    setChatSessions(loaded);
    
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

  const saveSession = (msgs: {role:'user'|'ai'; text:string}[]) => {
    let id = currentSessionId;
    let title = msgs.find(m => m.role === 'user')?.text.substring(0, 30).replace(/<[^>]*>?/gm, '') + '...';
    if (!id) {
      id = Date.now().toString();
      setCurrentSessionId(id);
    }
    setChatSessions(prev => {
      const existing = prev.find(s => s.id === id);
      let updated;
      if (existing) {
        updated = prev.map(s => s.id === id ? { ...s, messages: msgs } : s);
      } else {
        updated = [{ id, title: title || 'New Chat', date: new Date().toISOString(), messages: msgs }, ...prev];
      }
      saveToStorage('hz_prof_chats', updated);
      return updated;
    });
  };

  const startNewChat = () => {
    setChatMessages([{ role: 'ai', text: "Hello! I am Professor Hazel. I can help you create study schedules, clarify difficult topics with your uploaded notes, come up with mnemonics, and offer general academic support. How can I help you today?" }]);
    setCurrentSessionId(null);
    if (window.innerWidth < 768) setShowChatLog(false);
  };

  const loadSession = (session: ChatSession) => {
    setChatMessages(session.messages);
    setCurrentSessionId(session.id);
    if (window.innerWidth < 768) setShowChatLog(false);
  };

  const checkChatLimit = async () => {
    const limit = tier === 'pro' ? 15 : 2;
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

  const callLLM = async (systemPrompt:string, userText:string, files?:File[], useSearch:boolean = false) => {
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
          
          const payload: any = { contents, generationConfig: { maxOutputTokens: 8192, temperature: 0.7 } };
          if (useSearch) payload.tools = [{ google_search: {} }];

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
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
    const res = await fetch('/api/gemini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemPrompt,userText,useSearch})});
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

    const userMessage = text + (fileToSend ? ` <div class="text-xs text-indigo-300 mt-1 font-medium bg-indigo-900/40 inline-block px-2 py-1 rounded">📎 ${fileToSend.name}</div>` : '');
    const newMessages = [...chatMessages, { role: 'user' as const, text: userMessage }];
    setChatMessages(newMessages);
    setIsTyping(true);

    try {
      let promptContext = "You are Professor Hazel, an expert academic tutor. You are helpful, encouraging, and highly knowledgeable. Explain things clearly, format with markdown, and use bullet points where helpful.";
      
      const previousMessages = newMessages.map(m => `${m.role === 'user' ? 'Student' : 'Professor'}: ${m.text.replace(/<[^>]*>?/gm, '')}`).join('\n\n');
      
      const response = await callLLM(
        `${promptContext}\n\nHere is the conversation history:\n${previousMessages}`,
        text,
        fileToSend ? [fileToSend] : undefined,
        useWebSearch
      );
      
      const finalMessages = [...newMessages, { role: 'ai' as const, text: renderMarkdownWithMath(response) }];
      setChatMessages(finalMessages);
      saveSession(finalMessages);
    } catch (e: any) {
      setChatMessages([...newMessages, { role: 'ai', text: `<span class="text-red-400">Error: ${e.message}</span>` }]);
    }
    setIsTyping(false);
  };

  const MainSidebar = () => (
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
        <button className="w-full text-left sidebar-item active flex items-center gap-3"><Bot className="w-5 h-5" /> Professor Hazel</button>
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
      
      {/* Primary Sidebar */}
      {!showChatLog && <MainSidebar />}

      {/* Chat Log Sidebar (Collapses Main Sidebar) */}
      {showChatLog && (
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-40 fixed md:sticky top-0 left-0 transform transition-transform duration-300 ease-in-out">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400"/> Chat History</h2>
            <button onClick={() => setShowChatLog(false)} className="p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 border-b border-gray-800">
             <button onClick={startNewChat} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition">
               <MessageSquarePlus className="w-4 h-4"/> New Conversation
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatSessions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10">No past conversations.</p>
            ) : (
              chatSessions.map(session => (
                <button 
                  key={session.id} 
                  onClick={() => loadSession(session)}
                  className={`w-full text-left p-3 rounded-xl transition ${currentSessionId === session.id ? 'bg-indigo-900/40 border border-indigo-700/50 text-white' : 'hover:bg-gray-800 text-gray-300 border border-transparent'}`}
                >
                  <div className="font-bold text-sm truncate">{session.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(session.date).toLocaleDateString()}</div>
                </button>
              ))
            )}
          </div>
        </aside>
      )}

      <main className="flex-1 h-full flex flex-col relative bg-[#0F172A] z-10">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition mr-2"><Menu className="w-6 h-6" /></button>
            <div className="relative">
              <img src="/hazelnote_tutor.png" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 bg-white" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg">Professor Hazel</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-400 font-bold bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-800">AI Tutor</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowChatLog(!showChatLog)} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition text-sm ${showChatLog ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'}`}>
               <Clock className="w-4 h-4"/> History
             </button>
             {tier === 'free' && (
                <div className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                  {profile?.chat_stats?.date === new Date().toISOString().split('T')[0] ? 2 - profile.chat_stats.count : 2} / 2 msgs left
                </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-4 max-w-4xl mx-auto animate-slide-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'ai' ? (
                <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center shadow-lg border border-gray-200 overflow-hidden">
                   <img src="/hazelnote_tutor.png" className="w-full h-full object-cover"/>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg">U</div>
              )}
              <div className={`p-5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${msg.role === 'ai' ? 'bg-gray-800 border border-gray-700 rounded-tl-sm text-gray-200 markdown-body' : 'bg-indigo-600 text-white rounded-tr-sm'}`}>
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 max-w-4xl mx-auto animate-slide-in">
              <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center shadow-lg border border-gray-200 overflow-hidden">
                 <img src="/hazelnote_tutor.png" className="w-full h-full object-cover"/>
              </div>
              <div className="p-5 rounded-2xl bg-gray-800 border border-gray-700 rounded-tl-sm shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-gray-900 border-t border-gray-800 p-4 pb-6 z-20">
          <div className="max-w-4xl mx-auto">
            {chatFile && (
              <div className="mb-3 flex items-center gap-2 bg-gray-800 p-2.5 rounded-xl border border-gray-700 w-max">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-gray-300">{chatFile.name}</span>
                <button onClick={() => setChatFile(null)} className="ml-2 text-gray-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex gap-3 items-center mb-3">
               <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white transition bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                 <input type="checkbox" checked={useWebSearch} onChange={e => setUseWebSearch(e.target.checked)} className="accent-indigo-500 rounded w-3.5 h-3.5" />
                 <span className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400"/> Live Web Search</span>
               </label>
               {useWebSearch && <span className="text-[10px] text-gray-500">Hazel will search the internet for current info.</span>}
            </div>
            <div className="flex gap-3 items-end bg-gray-800 border border-gray-700 rounded-2xl p-2 shadow-inner">
              <input type="file" id="prof-chat-attachment" className="hidden" accept="image/*,.pdf" onChange={e => setChatFile(e.target.files?.[0] || null)} />
              <label htmlFor="prof-chat-attachment" className="p-3 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-xl cursor-pointer transition flex-shrink-0" title="Attach PDF or Image">
                <Paperclip className="w-5 h-5" />
              </label>
              
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                className="flex-1 bg-transparent text-white border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-[15px] focus:outline-none placeholder-gray-500"
                placeholder="Ask Professor Hazel a question..."
                rows={1}
              />
              
              <button 
                onClick={sendChatMessage} 
                disabled={(!chatInput.trim() && !chatFile) || isTyping}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-3">Professor Hazel can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
