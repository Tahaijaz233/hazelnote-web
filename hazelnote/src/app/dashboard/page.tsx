'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Send, Paperclip, Sparkles, RefreshCw, AlertCircle,
  Wand2, ChevronRight, ChevronDown, Folder, FolderPlus, FolderOpen,
  Trash2, Edit2, ArrowLeft, Printer, Languages, MessageCircleQuestion,
  Headphones, Play, Square, Rewind, FastForward, Mic, Save, Type,
  FileUp, LinkIcon, Network, CheckCircle, XCircle, BookOpen,
  BarChart2, Star, StopCircle, GripVertical
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeParseJSON, renderMarkdownWithMath } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
type StudySet = {
  id: number;
  title: string;
  parts: string[];
  createdAt: string;
  folderId?: number | null;
};

type Folder = {
  id: number;
  name: string;
  emoji: string;
};

type ChatMsg = { role: 'user' | 'ai'; text: string };

type Stats = {
  totalSets: number;
  streakDays: number;
  monthlySets: Record<string, number>;
};

// ── Daily message usage helpers ───────────────────────────────────────────────
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

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function NoteEditorToolbar({ onFormat, onInsertHtml, editorRangeRef }: {
  onFormat: (cmd: string, val: string) => void;
  onInsertHtml: (html: string) => void;
  editorRangeRef: React.MutableRefObject<Range | null>;
}) {
  const exec = (cmd: string, val = '') => {
    const sel = window.getSelection();
    if (editorRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(editorRangeRef.current);
    }
    document.execCommand(cmd, false, val);
  };
  return (
    <div className="flex flex-wrap gap-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 mb-3">
      {[
        { label: 'B', cmd: 'bold', title: 'Bold' },
        { label: 'I', cmd: 'italic', title: 'Italic' },
        { label: 'U', cmd: 'underline', title: 'Underline' },
        { label: 'S', cmd: 'strikeThrough', title: 'Strike' },
      ].map(({ label, cmd, title }) => (
        <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }}
          className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition" title={title}>
          {label}
        </button>
      ))}
      <div className="w-px bg-gray-700 mx-1"/>
      {(['1','2','3'] as const).map(h => (
        <button key={h} onMouseDown={e => { e.preventDefault(); exec('formatBlock', `h${h}`); }}
          className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition">
          H{h}
        </button>
      ))}
      <div className="w-px bg-gray-700 mx-1"/>
      <button onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}
        className="px-2 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition">• List</button>
      <button onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}
        className="px-2 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition">1. List</button>
      <button onMouseDown={e => { e.preventDefault(); onInsertHtml('<hr style="border-color:#374151;margin:1rem 0"/>'); }}
        className="px-2 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition">─ Divider</button>
    </div>
  );
}

function FlashcardsViewer({ text }: { text: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = text.split('\n').filter(l => l.includes('|')).map(l => { const [q, a] = l.split('|'); return { q: q?.replace(/^Q:/i,'').trim(), a: a?.trim() }; }).filter(c => c.q && c.a);
  if (!cards.length) return <p className="text-gray-500 text-center py-10">No flashcards generated.</p>;
  const card = cards[idx];
  return (
    <div className="max-w-xl mx-auto text-center">
      <p className="text-gray-400 text-sm font-bold mb-6">{idx + 1} / {cards.length}</p>
      <div className="cursor-pointer perspective-1000" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full min-h-[200px] transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-[24px] p-8 flex items-center justify-center backface-hidden">
            <p className="text-xl font-bold text-white">{card.q}</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-emerald-800 border border-green-600 rounded-[24px] p-8 flex items-center justify-center backface-hidden rotate-y-180">
            <p className="text-xl text-green-100">{card.a}</p>
          </div>
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-4 mb-8">Click card to reveal answer</p>
      <div className="flex justify-center gap-4">
        <button disabled={idx===0} onClick={() => { setIdx(idx-1); setFlipped(false); }} className="px-6 py-2.5 bg-gray-700 text-white rounded-xl font-bold disabled:opacity-30 hover:bg-gray-600 transition">← Prev</button>
        <button disabled={idx===cards.length-1} onClick={() => { setIdx(idx+1); setFlipped(false); }} className="px-6 py-2.5 bg-gray-700 text-white rounded-xl font-bold disabled:opacity-30 hover:bg-gray-600 transition">Next →</button>
      </div>
    </div>
  );
}

function QuizViewer({ text }: { text: string }) {
  const questions = text.split(/\n(?=\d+\.)/).map(block => {
    const lines = block.trim().split('\n');
    const q = lines[0].replace(/^\d+\.\s*/, '');
    const opts = lines.slice(1).filter(l => /^[A-D]\)/.test(l));
    const ansLine = lines.find(l => /^Answer:/i.test(l));
    const ans = ansLine?.replace(/^Answer:\s*/i,'').trim().charAt(0).toUpperCase();
    return { q, opts, ans };
  }).filter(q => q.q && q.opts.length);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  if (!questions.length) return <p className="text-gray-500 text-center py-10">No quiz questions generated.</p>;
  const score = submitted ? questions.filter((q,i) => selected[i] === q.ans).length : 0;
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {!submitted ? (
        <>
          {questions.map((q, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <p className="text-white font-bold mb-4">{i+1}. {q.q}</p>
              <div className="space-y-2">
                {q.opts.map((opt, j) => {
                  const letter = opt.charAt(0);
                  return (
                    <label key={j} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${selected[i]===letter ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'}`}>
                      <input type="radio" name={`q${i}`} value={letter} checked={selected[i]===letter} onChange={() => setSelected({...selected,[i]:letter})} className="hidden"/>
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 ${selected[i]===letter ? 'border-green-500 bg-green-500 text-white' : 'border-gray-500 text-gray-400'}`}>{letter}</span>
                      <span className="text-gray-200 text-sm">{opt.replace(/^[A-D]\)\s*/,'')}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={() => setSubmitted(true)} disabled={Object.keys(selected).length < questions.length} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition disabled:opacity-40">Submit Quiz</button>
        </>
      ) : (
        <div>
          <div className="text-center mb-8 p-6 bg-gray-800 rounded-2xl border border-gray-700">
            <p className="text-4xl font-extrabold text-white mb-1">{score}/{questions.length}</p>
            <p className="text-gray-400">{score===questions.length?'Perfect!':score>=questions.length*0.7?'Well done!':'Keep practicing!'}</p>
          </div>
          {questions.map((q,i) => (
            <div key={i} className={`mb-4 p-5 rounded-2xl border ${selected[i]===q.ans ? 'border-green-700 bg-green-900/10' : 'border-red-700 bg-red-900/10'}`}>
              <div className="flex items-start gap-2 mb-2">
                {selected[i]===q.ans ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"/> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"/>}
                <p className="text-white font-bold text-sm">{q.q}</p>
              </div>
              {selected[i]!==q.ans && <p className="text-sm text-red-300 ml-7">Your answer: {selected[i]} · Correct: {q.ans}</p>}
            </div>
          ))}
          <button onClick={() => { setSelected({}); setSubmitted(false); }} className="w-full py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition">Retake Quiz</button>
        </div>
      )}
    </div>
  );
}

// ── Voice languages ────────────────────────────────────────────────────────────
const VOICE_LANGUAGES = [
  'Auto-detect','English','Urdu','Arabic','French','Spanish','German',
  'Hindi','Chinese (Mandarin)','Japanese','Korean','Portuguese','Italian',
  'Russian','Turkish','Bengali',
];

// ── Main component ─────────────────────────────────────────────────────────────
function DashboardContent() {
  // Auth / tier
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<'free' | 'pro'>('free');

  // Layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard'|'create'|'study'>('dashboard');
  const [currentTab, setCurrentTab] = useState<'notes'|'flashcards'|'quiz'|'podcast'>('notes');

  // Study data
  const [studyHistory, setStudyHistory] = useState<StudySet[]>([]);
  const [currentStudySet, setCurrentStudySet] = useState<StudySet | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number|null>(null);
  const [stats, setStats] = useState<Stats>({ totalSets: 0, streakDays: 0, monthlySets: {} });

  // Input / create
  const [inputMode, setInputMode] = useState<'text'|'pdf'|'voice'|'link'>('text');
  const [inputText, setInputText] = useState('');
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState('');
  const [bgGenActive, setBgGenActive] = useState(false);

  // Notes editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const editorRangeRef = useRef<Range | null>(null);

  // Add context
  const [addContextModalOpen, setAddContextModalOpen] = useState(false);
  const [contextInputMode, setContextInputMode] = useState<'pdf'|'voice'|'link'>('voice');
  const [contextPdfFiles, setContextPdfFiles] = useState<File[]>([]);
  const [contextVoiceText, setContextVoiceText] = useState('');
  const [isAddingContextLoading, setIsAddingContextLoading] = useState(false);

  // Translate
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(-1);

  // Podcast / audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<0.5|1|1.5>(1);
  const audioUrlMapRef = useRef<Record<number, string>>({});

  // Ask Prof modal (audio Q&A)
  const [askModalOpen, setAskModalOpen] = useState(false);
  const isAskModalOpenRef = useRef(false);
  const [isAskRecording, setIsAskRecording] = useState(false);
  const [askResponse, setAskResponse] = useState('');
  const [isProfSpeaking, setIsProfSpeaking] = useState(false);
  const askMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const askChunksRef = useRef<Blob[]>([]);
  const profAudioRef = useRef<HTMLAudioElement | null>(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([{
    role: 'ai',
    text: `<b>Hi! I'm Professor Hazel.</b><br/>Ask me anything about this study set — definitions, examples, exam tips. What would you like to know?`,
  }]);
  const [chatInput, setChatInput] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [dailyMsgCount, setDailyMsgCount] = useState(0);

  // Folder modal
  const [folderModal, setFolderModal] = useState<{
    isOpen: boolean; type: 'create'|'edit'; name: string; emoji: string; folderId?: number;
  }>({ isOpen: false, type: 'create', name: '', emoji: '📁' });

  // Modals
  const [goProModalOpen, setGoProModalOpen] = useState(false);

  // Voice recording
  const [voiceLang, setVoiceLang] = useState('Auto-detect');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVoiceTranscribing, setIsVoiceTranscribing] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  const dailyLimit = tier === 'pro' ? 10 : 2;

  // ── Firebase sync ──────────────────────────────────────────────────────────
  const syncToFirebase = useCallback(async (set: StudySet) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'study_sets', `${user.uid}_${set.id}`), { ...set, userId: user.uid }, { merge: true });
    } catch (e) { console.error('Sync error', e); }
  }, [user]);

  // ── Load data ──────────────────────────────────────────────────────────────
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
    // Load local data
    try {
      const saved = localStorage.getItem('hz_study_sets');
      if (saved) setStudyHistory(JSON.parse(saved));
      const savedFolders = localStorage.getItem('hz_folders');
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      const savedStats = localStorage.getItem('hz_stats');
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch {}
    setDailyMsgCount(getDailyMsgCount());
    return () => unsub();
  }, []);

  const saveStudyHistory = useCallback((sets: StudySet[]) => {
    setStudyHistory(sets);
    localStorage.setItem('hz_study_sets', JSON.stringify(sets));
  }, []);

  const saveFolders = useCallback((f: Folder[]) => {
    setFolders(f);
    localStorage.setItem('hz_folders', JSON.stringify(f));
  }, []);

  const updateStats = useCallback((sets: StudySet[]) => {
    const newStats = { ...stats, totalSets: sets.length };
    const month = getCurrentMonth();
    newStats.monthlySets = { ...newStats.monthlySets, [month]: (newStats.monthlySets[month] || 0) };
    setStats(newStats);
    localStorage.setItem('hz_stats', JSON.stringify(newStats));
  }, [stats]);

  // ── Load study set ─────────────────────────────────────────────────────────
  const loadStudySet = useCallback((set: StudySet) => {
    setCurrentStudySet(set);
    setCurrentView('study');
    setCurrentTab('notes');
    setIsEditing(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setIsPlaying(false);
    const cachedAudio = audioUrlMapRef.current[set.id];
    setAudioUrl(cachedAudio || null);
    setChatMessages([{
      role: 'ai',
      text: `<b>Now studying: "${set.title}"</b><br/>Ask me anything about this topic!`,
    }]);
    window.history.pushState(null, '', '/dashboard/study/');
  }, []);

  // ── Podcast toggle ─────────────────────────────────────────────────────────
  const togglePodcast = useCallback(async () => {
    if (audioUrl) {
      // Already have audio — just play/pause
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }
    // Generate new audio
    if (!currentStudySet) return;
    setIsAudioLoading(true);
    setPodcastProgress(0);
    try {
      const podWordLimit = tier === 'pro' ? 1500 : 225;
      const notes = currentStudySet.parts[2] || '';
      const scriptPrompt = `You are Professor Hazel, an engaging AI tutor. Create a podcast-style teaching monologue based on these notes. Write a natural, flowing script of approximately ${podWordLimit} words maximum. Keep it educational and engaging.\n\nNotes:\n${notes.slice(0, 6000)}`;

      const scriptRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: scriptPrompt, systemPrompt: 'You are Professor Hazel.' }),
      });
      const scriptData = await scriptRes.json();
      const script = scriptData.result || '';
      setPodcastProgress(50);

      const ttsRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttsText: script }),
      });
      const ttsData = await ttsRes.json();
      if (ttsData.audioBase64) {
        const binary = atob(ttsData.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        audioUrlMapRef.current[currentStudySet.id] = url;
        setPodcastProgress(100);
        setTimeout(async () => {
          if (audioRef.current) { await audioRef.current.play(); setIsPlaying(true); }
        }, 300);
      }
    } catch (e) { console.error('Podcast error', e); }
    setIsAudioLoading(false);
  }, [audioUrl, isPlaying, currentStudySet, tier]);

  const changePlaybackRate = useCallback((rate: 0.5|1|1.5) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  // ── Handle add context ─────────────────────────────────────────────────────
  const handleAddContext = useCallback(async () => {
    if (!currentStudySet || tier !== 'pro') return;
    setIsAddingContextLoading(true);
    try {
      let contextText = '';
      if (contextInputMode === 'voice') {
        contextText = contextVoiceText;
      } else if (contextInputMode === 'link') {
        const urlEl = document.getElementById('context-url-input') as HTMLInputElement;
        contextText = urlEl?.value || '';
      } else if (contextInputMode === 'pdf' && contextPdfFiles.length) {
        contextText = `[PDF context: ${contextPdfFiles.map(f => f.name).join(', ')}]`;
      }

      const mergePrompt = `You have existing study notes:\n\n${currentStudySet.parts[2]}\n\n---\n\nAdditional context to integrate:\n${contextText}\n\n---\n\nMerge the additional context seamlessly into the existing notes, expanding and enriching them. Return only the updated notes HTML, starting directly with the content.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mergePrompt }),
      });
      const data = await res.json();
      const updatedNotes = data.result || currentStudySet.parts[2];
      const updatedParts = [...currentStudySet.parts];
      updatedParts[2] = updatedNotes;
      const updatedSet = { ...currentStudySet, parts: updatedParts };
      setCurrentStudySet(updatedSet);
      const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
      saveStudyHistory(newHistory);
      await syncToFirebase(updatedSet);

      // Clear cached audio so podcast regenerates
      delete audioUrlMapRef.current[updatedSet.id];
      setAudioUrl(null);
      setIsPlaying(false);
    } catch (e) { console.error('Add context error', e); }
    setIsAddingContextLoading(false);
    setAddContextModalOpen(false);
    setContextVoiceText('');
    setContextPdfFiles([]);
  }, [currentStudySet, tier, contextInputMode, contextVoiceText, contextPdfFiles, studyHistory, saveStudyHistory, syncToFirebase]);

  // ── Generate study set ─────────────────────────────────────────────────────
  const generateStudySet = useCallback(async (background = false) => {
    // Free tier monthly limit
    const month = getCurrentMonth();
    const thisMonthCount = stats.monthlySets?.[month] || 0;
    if (tier === 'free' && thisMonthCount >= 2) {
      setGoProModalOpen(true);
      return;
    }

    let content = '';
    if (inputMode === 'text') content = inputText;
    else if (inputMode === 'voice') content = voiceText;
    else if (inputMode === 'link') {
      const urlEl = document.getElementById('youtube-url-input') as HTMLInputElement;
      content = urlEl?.value || '';
    }

    if (!content.trim() && pdfFiles.length === 0) return;

    if (background) {
      setBgGenActive(true);
    } else {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingTip('Analysing your content...');
    }

    const tips = [
      'Extracting key concepts...','Building your study set...','Generating flashcards...',
      'Crafting quiz questions...','Writing podcast script...','Almost ready!'
    ];
    let tipIdx = 0;
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % tips.length;
      setLoadingTip(tips[tipIdx]);
    }, 2500);

    const progressInterval = setInterval(() => {
      setLoadingProgress(p => Math.min(p + 1.5, 92));
    }, 200);

    try {
      const podWordLimit = tier === 'pro' ? 1500 : 225;
      const prompt = `You are Professor Hazel. Analyse the following content and produce a comprehensive study set.

Content:
${content}

Return EXACTLY this structure separated by "===PART===":
Part 0: A short title (max 8 words, no quotes)
Part 1: An executive summary paragraph (3-5 sentences, plain text)
Part 2: Detailed study notes in rich HTML with headings, bullet points, bold terms, examples
Part 3: 10-15 flashcards in format Q: question | answer (one per line)
Part 4: 8-10 MCQ quiz questions. Each question: "1. Question text\\nA) option\\nB) option\\nC) option\\nD) option\\nAnswer: A"
Part 5: A podcast teaching monologue, max ${podWordLimit} words, conversational and educational`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pdfFiles: pdfFiles.length > 0 }),
      });
      const data = await res.json();
      const result = data.result || '';
      const parts = result.split('===PART===').map((p: string) => p.trim());

      const newSet: StudySet = {
        id: Date.now(),
        title: parts[0] || 'Study Set',
        parts,
        createdAt: new Date().toISOString(),
        folderId: selectedFolder,
      };

      const newHistory = [newSet, ...studyHistory];
      saveStudyHistory(newHistory);

      const month2 = getCurrentMonth();
      const newStats = {
        ...stats,
        totalSets: newHistory.length,
        monthlySets: { ...stats.monthlySets, [month2]: (stats.monthlySets[month2] || 0) + 1 },
      };
      setStats(newStats);
      localStorage.setItem('hz_stats', JSON.stringify(newStats));

      if (tier === 'pro') await syncToFirebase(newSet);

      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setLoadingProgress(100);

      if (background) {
        setBgGenActive(false);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          loadStudySet(newSet);
        }, 500);
      }
    } catch (e) {
      console.error('Generate error', e);
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setIsLoading(false);
      setBgGenActive(false);
    }
  }, [inputMode, inputText, voiceText, pdfFiles, tier, stats, studyHistory, selectedFolder, saveStudyHistory, syncToFirebase, loadStudySet]);

  // ── Voice recording ────────────────────────────────────────────────────────
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = e => voiceChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsVoiceTranscribing(true);
        try {
          const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const langInstr = voiceLang === 'Auto-detect' ? 'Transcribe the audio accurately.' : `Transcribe the audio in ${voiceLang}.`;
            const res = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64,
                audioMimeType: recorder.mimeType,
                systemPrompt: langInstr,
              }),
            });
            const data = await res.json();
            setVoiceText(prev => prev ? prev + ' ' + (data.result || '') : (data.result || ''));
            setIsVoiceTranscribing(false);
          };
          reader.readAsDataURL(blob);
        } catch { setIsVoiceTranscribing(false); }
      };
      voiceMediaRecorderRef.current = recorder;
      recorder.start();
      setIsVoiceRecording(true);
    } catch (e) { console.error('Mic error', e); }
  }, [voiceLang]);

  const stopVoiceRecording = useCallback(() => {
    voiceMediaRecorderRef.current?.stop();
    setIsVoiceRecording(false);
  }, []);

  // ── Chat message ───────────────────────────────────────────────────────────
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    const count = getDailyMsgCount();
    if (count >= dailyLimit) {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `<span class="text-red-400 font-bold">⚠ Daily message limit reached.</span> You've used all ${dailyLimit} messages for today. Come back tomorrow!${tier === 'free' ? ' <a href="/pricing/" class="text-green-400 underline">Upgrade to Pro</a> for more messages.' : ''}`,
      }]);
      return;
    }
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    try {
      const context = currentStudySet ? currentStudySet.parts[2]?.slice(0, 3000) : '';
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          systemPrompt: `You are Professor Hazel, a friendly expert tutor.${context ? ` Context from student's notes:\n${context}` : ''}\nGive clear, helpful answers. Use HTML formatting for clarity.`,
        }),
      });
      const data = await res.json();
      incrementDailyMsgCount();
      setDailyMsgCount(getDailyMsgCount());
      setChatMessages(prev => [...prev, { role: 'ai', text: data.result || 'Sorry, I had trouble responding.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'An error occurred. Please try again.' }]);
    }
  }, [chatInput, dailyLimit, tier, currentStudySet]);

  // ── Translate ──────────────────────────────────────────────────────────────
  const translateNotes = useCallback(async () => {
    if (!currentStudySet) return;
    const langEl = document.getElementById('translate-language') as HTMLSelectElement;
    const lang = langEl?.value || 'Urdu';
    setTranslateProgress(0);
    const progInterval = setInterval(() => setTranslateProgress(p => Math.min(p + 2, 90)), 200);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Translate the following study notes into ${lang}. Preserve all HTML formatting:\n\n${currentStudySet.parts[2]}`,
        }),
      });
      const data = await res.json();
      const updated = { ...currentStudySet, parts: [...currentStudySet.parts] };
      updated.parts[2] = data.result || currentStudySet.parts[2];
      setCurrentStudySet(updated);
      saveStudyHistory(studyHistory.map(s => s.id === updated.id ? updated : s));
      clearInterval(progInterval);
      setTranslateProgress(100);
      setTimeout(() => { setTranslateProgress(-1); setTranslateModalOpen(false); }, 1000);
    } catch { clearInterval(progInterval); setTranslateProgress(-1); }
  }, [currentStudySet, studyHistory, saveStudyHistory]);

  // ── Editor selection tracking ──────────────────────────────────────────────
  const handleEditorSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) editorRangeRef.current = sel.getRangeAt(0).cloneRange();
  }, []);

  // ── Ask Prof (audio Q&A) ───────────────────────────────────────────────────
  const handleAskProfessor = useCallback(() => {
    if (isPlaying && audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
    isAskModalOpenRef.current = true;
    setAskModalOpen(true);
    setAskResponse('');
  }, [isPlaying]);

  const stopProfSpeaking = useCallback(() => {
    if (profAudioRef.current) { profAudioRef.current.pause(); profAudioRef.current = null; }
    setIsProfSpeaking(false);
  }, []);

  const toggleAskRecording = useCallback(async () => {
    if (isAskRecording) {
      askMediaRecorderRef.current?.stop();
      setIsAskRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        askChunksRef.current = [];
        recorder.ondataavailable = e => askChunksRef.current.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(askChunksRef.current, { type: recorder.mimeType });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const transRes = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, audioMimeType: recorder.mimeType, systemPrompt: 'Transcribe this audio.' }),
            });
            const transData = await transRes.json();
            const question = transData.result || '';
            const context = currentStudySet?.parts[2]?.slice(0, 3000) || '';
            const ansRes = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: question,
                systemPrompt: `You are Professor Hazel. Answer clearly and concisely.${context ? ` Context: ${context}` : ''}`,
              }),
            });
            const ansData = await ansRes.json();
            const answer = ansData.result || '';
            setAskResponse(answer);
            // TTS the answer
            try {
              const ttsRes = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ttsText: answer.replace(/<[^>]+>/g, '') }),
              });
              const ttsData = await ttsRes.json();
              if (ttsData.audioBase64) {
                const bin = atob(ttsData.audioBase64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
                const audio = new Audio(url);
                profAudioRef.current = audio;
                setIsProfSpeaking(true);
                audio.play();
                audio.onended = () => setIsProfSpeaking(false);
              }
            } catch {}
          };
          reader.readAsDataURL(blob);
        };
        askMediaRecorderRef.current = recorder;
        recorder.start();
        setIsAskRecording(true);
      } catch (e) { console.error('Ask mic error', e); }
    }
  }, [isAskRecording, currentStudySet]);

  // ── Folder helpers ─────────────────────────────────────────────────────────
  const handleSaveFolder = useCallback(() => {
    if (!folderModal.name.trim()) return;
    if (folderModal.type === 'create') {
      const newFolder: Folder = { id: Date.now(), name: folderModal.name, emoji: folderModal.emoji || '📁' };
      saveFolders([...folders, newFolder]);
    } else if (folderModal.folderId) {
      saveFolders(folders.map(f => f.id === folderModal.folderId ? { ...f, name: folderModal.name, emoji: folderModal.emoji } : f));
    }
    setFolderModal({ isOpen: false, type: 'create', name: '', emoji: '📁' });
  }, [folderModal, folders, saveFolders]);

  const deleteFolder = useCallback((folderId: number) => {
    saveFolders(folders.filter(f => f.id !== folderId));
    saveStudyHistory(studyHistory.map(s => s.folderId === folderId ? { ...s, folderId: null } : s));
    setFolderModal({ isOpen: false, type: 'create', name: '', emoji: '📁' });
  }, [folders, studyHistory, saveFolders, saveStudyHistory]);

  const deleteStudySet = useCallback(async (id: number) => {
    const newHistory = studyHistory.filter(s => s.id !== id);
    saveStudyHistory(newHistory);
    if (currentStudySet?.id === id) setCurrentView('dashboard');
  }, [studyHistory, currentStudySet, saveStudyHistory]);

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const displayedSets = selectedFolder === null
    ? studyHistory
    : studyHistory.filter(s => s.folderId === selectedFolder);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 z-50 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        ${sidebarCollapsed ? 'w-[72px]' : 'w-72'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between h-[72px]">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <img src="/hazelnotehorizontal.png" className="h-8 object-contain" alt="HazelNote"/>
            </Link>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 transition ml-auto">
            <Menu className="w-5 h-5"/>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button onClick={() => { setCurrentView('dashboard'); window.history.pushState(null,'','/dashboard/'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition ${currentView==='dashboard'?'bg-green-500/20 text-green-400':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0"/>
            {!sidebarCollapsed && 'Dashboard'}
          </button>
          <button onClick={() => { setCurrentView('create'); window.history.pushState(null,'','/dashboard/create/'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition ${currentView==='create'?'bg-green-500/20 text-green-400':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <PlusCircle className="w-5 h-5 flex-shrink-0"/>
            {!sidebarCollapsed && 'Create Study Set'}
          </button>
          <Link href="/exam/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <ClipboardList className="w-5 h-5 flex-shrink-0"/>
            {!sidebarCollapsed && 'Practice Exam'}
          </Link>
          <Link href="/professor/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <img src="/hazelnote_tutor.png" className="w-5 h-5 rounded-full object-cover flex-shrink-0 bg-white"/>
            {!sidebarCollapsed && 'Professor Hazel'}
          </Link>
          <Link href="/profile/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <UserCircle className="w-5 h-5 flex-shrink-0"/>
            {!sidebarCollapsed && 'Profile'}
          </Link>
          <Link href="/support/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
            <HelpCircle className="w-5 h-5 flex-shrink-0"/>
            {!sidebarCollapsed && 'Support'}
          </Link>

          {/* Folders section */}
          {!sidebarCollapsed && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Folders</span>
                <button onClick={() => setFolderModal({ isOpen: true, type: 'create', name: '', emoji: '📁' })}
                  className="p-1 hover:bg-gray-800 rounded-lg transition text-gray-500 hover:text-white">
                  <FolderPlus className="w-4 h-4"/>
                </button>
              </div>
              <button onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${selectedFolder===null?'bg-gray-800 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <FolderOpen className="w-4 h-4"/> All Sets
              </button>
              {folders.map(f => (
                <div key={f.id} className="flex items-center group">
                  <button onClick={() => setSelectedFolder(f.id)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition text-left ${selectedFolder===f.id?'bg-gray-800 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <span>{f.emoji}</span> {f.name}
                  </button>
                  <button onClick={() => setFolderModal({ isOpen: true, type: 'edit', name: f.name, emoji: f.emoji, folderId: f.id })}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded-lg transition mr-1">
                    <Edit2 className="w-3 h-3 text-gray-400"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Tier badge */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            {tier === 'free' ? (
              <Link href="/pricing/" className="block bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl text-center hover:opacity-90 transition">
                ⚡ Upgrade to Pro
              </Link>
            ) : (
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5"/> Pro Plan Active
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-72'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-800 px-4 md:px-8 h-[72px] flex items-center justify-between">
          <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-800 rounded-xl text-gray-400">
            <Menu className="w-5 h-5"/>
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-3">
            {/* Daily message counter */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${(dailyLimit - dailyMsgCount) <= 0 ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              <AlertCircle className="w-3 h-3"/>
              {Math.max(0, dailyLimit - dailyMsgCount)}/{dailyLimit} msgs
            </div>
            <button onClick={() => { setCurrentView('create'); }} className="btn-primary px-4 py-2 text-sm hidden sm:flex items-center gap-2">
              <PlusCircle className="w-4 h-4"/> New Set
            </button>
          </div>
        </header>

        {/* Dashboard home */}
        {currentView === 'dashboard' && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto pt-6 md:pt-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Sets', value: stats.totalSets, icon: <BookOpen className="w-5 h-5"/>, color: 'text-green-400' },
                { label: 'This Month', value: stats.monthlySets?.[getCurrentMonth()] || 0, icon: <BarChart2 className="w-5 h-5"/>, color: 'text-blue-400' },
                { label: 'Plan', value: tier === 'pro' ? 'Pro' : 'Free', icon: <Star className="w-5 h-5"/>, color: 'text-amber-400' },
                { label: 'Messages Left', value: `${Math.max(0, dailyLimit - dailyMsgCount)}/${dailyLimit}`, icon: <AlertCircle className="w-5 h-5"/>, color: (dailyLimit - dailyMsgCount) <= 0 ? 'text-red-400' : 'text-purple-400' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 md:p-5">
                  <div className={`${color} mb-2`}>{icon}</div>
                  <div className="text-xl md:text-2xl font-extrabold text-white">{value}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Study sets list */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-white">
                {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || 'Folder' : 'All Study Sets'}
              </h2>
              <button onClick={() => setCurrentView('create')} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4"/> Create
              </button>
            </div>

            {displayedSets.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30"/>
                <p className="font-bold text-lg mb-2">No study sets yet</p>
                <p className="text-sm mb-6">Create your first study set to get started</p>
                <button onClick={() => setCurrentView('create')} className="btn-primary px-6 py-3">
                  <PlusCircle className="w-4 h-4 inline mr-2"/> Create Study Set
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedSets.map(set => (
                  <div key={set.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 hover:border-gray-600 transition group cursor-pointer"
                    onClick={() => loadStudySet(set)}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-extrabold text-white text-sm leading-snug line-clamp-2 flex-1 mr-2">{set.title}</h3>
                      <button onClick={e => { e.stopPropagation(); deleteStudySet(set.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 rounded-lg transition text-red-400 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2">{set.parts[1]}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition"/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create view */}
        {currentView === 'create' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto pt-6 md:pt-10">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Create Study Set</h1>
              <p className="text-gray-400">Add your content and let Professor Hazel build your study materials.</p>
            </div>

            {/* Free tier warning */}
            {tier === 'free' && (
              <div className="mb-6 bg-amber-900/20 border border-amber-700/50 rounded-2xl px-5 py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0"/>
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-bold">Free plan: {stats.monthlySets?.[getCurrentMonth()] || 0}/2 study sets used this month</p>
                  <p className="text-amber-400/70 text-xs mt-0.5"><Link href="/pricing/" className="underline">Upgrade to Pro</Link> for unlimited sets.</p>
                </div>
              </div>
            )}

            {/* Input mode tabs */}
            <div className="bg-gray-900/50 p-1.5 rounded-[20px] flex gap-1 mb-6 border border-gray-800 overflow-x-auto">
              {([
                { mode: 'text', label: 'Text / Notes', icon: <Type className="w-4 h-4"/> },
                { mode: 'pdf', label: 'PDF Upload', icon: <FileUp className="w-4 h-4"/> },
                { mode: 'voice', label: 'Voice Input', icon: <Mic className="w-4 h-4"/> },
                { mode: 'link', label: 'YouTube URL', icon: <LinkIcon className="w-4 h-4"/> },
              ] as const).map(({ mode, label, icon }) => (
                <button key={mode} onClick={() => setInputMode(mode)}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-0 ${inputMode===mode?'bg-green-500 text-white shadow-md':'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  {icon} <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {inputMode === 'text' && (
              <div className="glass-card p-6 md:p-8 bg-gray-800/50 backdrop-blur-lg">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="w-full h-52 p-5 border border-gray-600 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-700 text-white resize-none"
                  placeholder="Paste your notes, textbook content, or any text you want to study…"
                />
              </div>
            )}

            {inputMode === 'pdf' && (
              <div className="glass-card p-8 md:p-10 bg-gray-800/50 backdrop-blur-lg text-center border-2 border-dashed border-gray-600 rounded-2xl">
                <input type="file" id="pdf-upload" multiple accept=".pdf" className="hidden"
                  onChange={e => { const files = Array.from(e.target.files || []); setPdfFiles(prev => [...prev, ...files]); }}/>
                <FileUp className="w-12 h-12 text-gray-500 mx-auto mb-4"/>
                <label htmlFor="pdf-upload" className="btn-primary px-8 py-3 cursor-pointer inline-flex items-center gap-2">
                  <FileUp className="w-4 h-4"/> Select PDFs
                </label>
                {pdfFiles.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {pdfFiles.map((file, i) => (
                      <span key={i} className="bg-green-900/30 text-green-300 text-xs px-3 py-1.5 rounded-full font-bold border border-green-800 flex items-center gap-2">
                        {file.name}
                        <button onClick={() => setPdfFiles(pdfFiles.filter((_,idx) => idx !== i))} className="hover:text-red-400">
                          <X className="w-3 h-3"/>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {inputMode === 'voice' && (
              <div className="glass-card p-8 bg-gray-800/50 backdrop-blur-lg space-y-6">
                {/* Language selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-gray-400 whitespace-nowrap">Language:</label>
                  <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-green-500">
                    {VOICE_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                {/* Wave animation + record button */}
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-end gap-3">
                    {/* Left wave bars */}
                    <div className="flex items-end gap-1" style={{ height: '52px' }}>
                      {[0.0, 0.1, 0.15, 0.05, 0.2].map((delay, i) => (
                        <div key={i}
                          className={`voice-wave-bar w-2 rounded-full ${isVoiceRecording ? 'bg-green-400' : 'bg-gray-600'}`}
                          style={{
                            height: isVoiceRecording ? `${20 + (i * 7)}px` : '8px',
                            animationDelay: isVoiceRecording ? `${delay}s` : '0s',
                            animationPlayState: isVoiceRecording ? 'running' : 'paused',
                            transition: 'height 0.3s ease',
                          }}
                        />
                      ))}
                    </div>

                    {/* Record Button */}
                    <button
                      onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isVoiceTranscribing}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl disabled:opacity-50 ${
                        isVoiceRecording
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : 'bg-green-500 hover:bg-green-600 hover:scale-105'
                      }`}
                    >
                      {isVoiceTranscribing
                        ? <RefreshCw className="w-7 h-7 text-white animate-spin"/>
                        : isVoiceRecording
                          ? <Square className="w-7 h-7 text-white"/>
                          : <Mic className="w-7 h-7 text-white"/>
                      }
                    </button>

                    {/* Right wave bars */}
                    <div className="flex items-end gap-1" style={{height:'52px'}}>
                      {[0.25, 0.3, 0.35, 0.2, 0.4].map((delay,i)=>(
                        <div key={i} className={`voice-wave-bar w-2 rounded-full ${isVoiceRecording ? 'bg-green-400' : 'bg-gray-600'}`}
                          style={{
                            height: isVoiceRecording ? `${20 + Math.random() * 32}px` : '8px',
                            animationDelay: isVoiceRecording ? `${delay}s` : '0s',
                            animationPlayState: isVoiceRecording ? 'running' : 'paused',
                            transition: 'height 0.1s ease',
                          }}/>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    {isVoiceTranscribing
                      ? <p className="text-sm font-bold text-green-400 animate-pulse">Transcribing your voice…</p>
                      : isVoiceRecording
                        ? <p className="text-sm font-bold text-red-400">Recording — tap to stop</p>
                        : <p className="text-sm text-gray-500">Tap mic to start recording · <span className="text-green-400 font-medium">{voiceLang}</span></p>
                    }
                  </div>
                </div>

                <textarea
                  value={voiceText}
                  onChange={e=>setVoiceText(e.target.value)}
                  className="w-full h-36 p-5 border border-gray-600 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-700 text-white resize-none"
                  placeholder="Transcribed text will appear here. You can also type directly…"
                />
              </div>
            )}

            {inputMode==='link'&&(
              <div className="glass-card p-8 md:p-10 bg-gray-800/50 backdrop-blur-lg">
                <input type="text" id="youtube-url-input" onFocus={(e)=>setTimeout(()=>e.target.scrollIntoView({behavior:'smooth',block:'center'}),300)} className="w-full border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 bg-gray-700 text-white" placeholder="Paste a YouTube URL here..."/>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={()=>generateStudySet(false)} className="btn-primary px-10 md:px-16 py-4 md:py-5 text-lg md:text-xl shadow-xl flex items-center justify-center gap-3 mx-auto w-full sm:w-auto">
                <Wand2 className="w-5 h-5"/> Generate Study Set
              </button>
              {tier==='pro'&&(
                <button onClick={()=>{generateStudySet(true);setCurrentView('dashboard');}} className="px-8 py-4 rounded-full border-2 border-indigo-500 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50 font-bold text-sm transition flex items-center justify-center gap-2 w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4"/> Generate in Background (Pro)
                </button>
              )}
            </div>
          </div>
        )}

        {bgGenActive&&currentView!=='create'&&(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
            <RefreshCw className="w-5 h-5 animate-spin"/>
            <span className="font-bold text-sm">Generating study set in background…</span>
          </div>
        )}

        {isLoading&&(
          <div className="max-w-2xl mx-auto mt-10 text-center p-8 md:p-12">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-700"></circle>
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283-(283*loadingProgress/100)} className="text-green-500 transition-all duration-300 ease-out glow-animation-stroke" strokeLinecap="round"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-extrabold text-white tracking-tighter">{Math.round(loadingProgress)}%</span></div>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">Synthesizing Knowledge...</h3>
            <p className="text-sm font-medium text-green-400 bg-green-900/30 px-5 py-2.5 rounded-full border border-green-800 inline-block">{loadingTip}</p>
          </div>
        )}

        {currentView==='study'&&currentStudySet&&(
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 pt-6 md:pt-10 relative">
            <div className="mb-6 flex justify-between items-center">
              <button onClick={()=>{setCurrentView('dashboard');window.history.pushState(null,'','/dashboard/');}} className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-medium"><ArrowLeft className="w-4 h-4"/> Back</button>
            </div>
            <div className="glass-card bg-gray-800/50 backdrop-blur-lg border-gray-700 relative overflow-visible">
              <div className="border-b border-gray-700 bg-gray-800/50 p-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-t-[24px]">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{currentStudySet.title}</h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button onClick={()=>window.print()} className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-gray-600"><Printer className="w-4 h-4"/> Export PDF</button>
                  <button onClick={()=>setTranslateModalOpen(true)} className="text-sm bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-blue-800"><Languages className="w-4 h-4"/> Translate</button>
                  <button onClick={()=>{setSidebarCollapsed(true);setChatOpen(true);}} className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md border border-green-600"><img src="/hazelnote_tutor.png" className="w-5 h-5 rounded-full object-cover aspect-square bg-white border border-green-400"/> Chat with Professor Hazel</button>
                </div>
              </div>

              <div className="px-6 md:px-8 pt-8 pb-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] z-10 relative">
                <div className="inline-flex p-1.5 bg-gray-800 border border-gray-700 rounded-[20px] shadow-sm gap-1 overflow-x-auto max-w-full">
                  {(['notes','flashcards','quiz','podcast'] as const).map((tab)=>(
                    <button key={tab} onClick={()=>setCurrentTab(tab)} className={`text-sm px-5 py-2.5 rounded-xl font-bold transition-all ${currentTab===tab?'bg-green-500 text-white shadow-md transform scale-[1.02]':'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                      {tab.charAt(0).toUpperCase()+tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 min-h-[600px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] study-content-area rounded-b-[24px]">
                {currentTab==='notes'&&(
                  <div>
                    {tier==='pro'&&(
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3"/> Pro Editing Enabled</span>
                          <div className="flex gap-2">
                            <button onClick={()=>setAddContextModalOpen(true)} className="text-xs bg-indigo-900/40 border border-indigo-700 text-indigo-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-800/60 transition"><Network className="w-3 h-3"/> Add Context (Pro)</button>
                            {isEditing?(
                              <>
                                <button onClick={async()=>{
                                  const up=[...currentStudySet.parts];up[1]=editedSummary;up[2]=editedNotes;
                                  const set={...currentStudySet,parts:up};
                                  setCurrentStudySet(set);setStudyHistory(studyHistory.map(s=>s.id===set.id?set:s));
                                  if(tier==='pro') await syncToFirebase(set);setIsEditing(false);
                                }} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold"><Save className="w-3 h-3 inline mr-1"/>Save</button>
                                <button onClick={()=>setIsEditing(false)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg font-bold">Cancel</button>
                              </>
                            ):(
                              <button onClick={()=>{setEditedSummary(renderMarkdownWithMath(currentStudySet.parts[1]));setEditedNotes(renderMarkdownWithMath(currentStudySet.parts[2]));setIsEditing(true);}} className="text-xs bg-blue-900/40 border border-blue-800 text-blue-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition"><Type className="w-3 h-3"/> Edit Notes</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {isEditing&&tier==='pro'&&(
                      <NoteEditorToolbar
                        onFormat={(cmd:string,val:string)=>document.execCommand(cmd,false,val)}
                        onInsertHtml={(html:string)=>document.execCommand('insertHTML',false,html)}
                        editorRangeRef={editorRangeRef}
                      />
                    )}
                    {isEditing&&tier==='pro'?(
                      <div className="space-y-6">
                        <div className="bg-green-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-green-500/40 relative">
                          <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Summary</div>
                          <div className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[100px] note-editor-content" contentEditable suppressContentEditableWarning onBlur={(e)=>setEditedSummary(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:editedSummary}}/>
                        </div>
                        <div className="bg-blue-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-blue-500/40 relative">
                          <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Notes</div>
                          <div id="active-pro-editor" className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[400px] note-editor-content" contentEditable suppressContentEditableWarning
                            onMouseUp={handleEditorSelection} onKeyUp={handleEditorSelection}
                            onBlur={(e)=>setEditedNotes(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:editedNotes}}/>
                        </div>
                      </div>
                    ):(
                      <div className="animate-slide-in">
                        <div className="bg-green-900/20 p-6 md:p-8 rounded-[24px] mb-8 border border-green-800/50">
                          <h3 className="text-green-400 font-extrabold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Executive Summary</h3>
                          <div className="text-gray-200 text-lg leading-relaxed" dangerouslySetInnerHTML={{__html:renderMarkdownWithMath(currentStudySet.parts[1])}}/>
                        </div>
                        <div className="prose prose-lg max-w-none text-gray-200" dangerouslySetInnerHTML={{__html:renderMarkdownWithMath(currentStudySet.parts[2])}}/>
                      </div>
                    )}
                  </div>
                )}
                {currentTab==='flashcards'&&<FlashcardsViewer text={currentStudySet.parts[3]}/>}
                {currentTab==='quiz'&&<QuizViewer text={currentStudySet.parts[4]}/>}
                {currentTab==='podcast'&&(
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 md:p-12 text-white text-center shadow-xl border border-indigo-500/30">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        {isAudioLoading?<RefreshCw className="w-10 h-10 text-white animate-spin"/>:<Headphones className="w-10 h-10 text-white"/>}
                        {isPlaying&&<div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>}
                      </div>
                      <h3 className="text-3xl font-extrabold mb-2">Audio Lesson</h3>
                      <p className="text-indigo-200 mb-2 max-w-md mx-auto text-sm">
                        Listen to a custom AI-generated teaching monologue. ({tier==='pro'?'Max 10 mins':'Max 1.5 mins'})
                      </p>
                      {/* Show "cached" badge if audio already generated */}
                      {audioUrl && !isAudioLoading && (
                        <div className="inline-flex items-center gap-1.5 bg-green-900/30 border border-green-700 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                          <CheckCircle className="w-3 h-3"/> Audio ready — no regeneration needed
                        </div>
                      )}
                      {isAudioLoading&&(
                        <div className="w-full bg-indigo-950/50 rounded-full h-2 mb-6 max-w-xs mx-auto overflow-hidden">
                          <div className="bg-white h-2 transition-all duration-300" style={{width:`${podcastProgress}%`}}></div>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-6">
                        <audio ref={audioRef} src={audioUrl||undefined}
                          onTimeUpdate={()=>setAudioProgress(audioRef.current?.currentTime||0)}
                          onLoadedMetadata={()=>setAudioDuration(audioRef.current?.duration||0)}
                          onEnded={()=>setIsPlaying(false)}
                          className="hidden"/>
                        <div className="w-full flex flex-col gap-2 max-w-sm">
                          <input type="range" min="0" max={audioDuration||100} value={audioProgress}
                            onChange={(e)=>{if(audioRef.current){audioRef.current.currentTime=Number(e.target.value);setAudioProgress(Number(e.target.value));}}}
                            className="w-full accent-white"/>
                          <div className="flex justify-between text-xs text-indigo-300 font-mono">
                            <span>{Math.floor(audioProgress/60)}:{Math.floor(audioProgress%60).toString().padStart(2,'0')}</span>
                            <span>{Math.floor(audioDuration/60)}:{Math.floor(audioDuration%60).toString().padStart(2,'0')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <button onClick={()=>{if(audioRef.current)audioRef.current.currentTime-=10;}} className="text-white hover:text-indigo-300 transition" title="-10s"><Rewind className="w-7 h-7"/></button>
                          <button onClick={togglePodcast} disabled={isAudioLoading} className="bg-white text-indigo-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg disabled:opacity-50">
                            {isPlaying?<Square className="w-6 h-6"/>:<Play className="w-6 h-6 ml-1"/>}
                          </button>
                          <button onClick={()=>{if(audioRef.current)audioRef.current.currentTime+=10;}} className="text-white hover:text-indigo-300 transition" title="+10s"><FastForward className="w-7 h-7"/></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider mr-1">Speed:</span>
                          {([0.5,1,1.5] as const).map(rate=>(
                            <button key={rate} onClick={()=>changePlaybackRate(rate)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${playbackRate===rate?'bg-white text-indigo-900 border-white':'border-indigo-400/50 text-indigo-200 hover:bg-white/10'}`}>
                              {rate}x
                            </button>
                          ))}
                        </div>
                        {tier==='pro'&&(
                          <div className="pt-6 border-t border-indigo-500/30 w-full mt-4">
                            <button onClick={handleAskProfessor} className="flex items-center justify-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-md">
                              <MessageCircleQuestion className="w-5 h-5"/> Ask Professor (Audio Q&A)
                            </button>
                            <p className="text-xs text-indigo-300 mt-2">Pause and ask AI a question using your microphone.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chat Panel */}
      {chatOpen&&(
        <div className={`fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-700 transition-transform duration-300 ${chatOpen?'translate-x-0':'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <div className="flex items-center gap-3">
              <img src="/hazelnote_tutor.png" className="w-10 h-10 rounded-full object-cover border-2 border-green-500 bg-green-900/30"/>
              <div><h3 className="font-extrabold text-white text-base">Professor Hazel</h3><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs text-green-400 font-bold">Online AI Tutor</span></div></div>
            </div>
            <div className="flex items-center gap-2">
              {/* Daily limit badge in chat header */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${(dailyLimit - dailyMsgCount) <= 0 ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                <AlertCircle className="w-3 h-3"/>
                {Math.max(0, dailyLimit - dailyMsgCount)}/{dailyLimit}
              </div>
              <button onClick={()=>{setChatOpen(false);setSidebarCollapsed(false);}} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full"><X className="w-5 h-5"/></button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900 flex flex-col">
            {chatMessages.map((msg,i)=>(
              <div key={i} className={`flex gap-3 max-w-[90%] animate-slide-in ${msg.role==='user'?'ml-auto flex-row-reverse':''}`}>
                {msg.role==='ai'?<img src="/hazelnote_tutor.png" className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-white"/>:<div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">U</div>}
                <div className={`p-3 text-sm rounded-2xl ${msg.role==='ai'?'bg-gray-800 border border-gray-700 rounded-tl-sm text-gray-200':'bg-green-500 text-white rounded-tr-sm'}`} dangerouslySetInnerHTML={{__html:msg.text}}/>
              </div>
            ))}
          </div>
          {/* Limit reached banner inside chat */}
          {(dailyLimit - dailyMsgCount) <= 0 && (
            <div className="mx-4 mb-2 px-4 py-2.5 bg-red-900/30 border border-red-700 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
              Daily limit reached. Resets in 24 hours.
              {tier==='free' && <Link href="/pricing/" className="text-green-400 underline ml-1">Upgrade</Link>}
            </div>
          )}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            {chatFile&&(
              <div className="mb-3 flex items-center gap-2 bg-gray-700 p-2 rounded-lg text-xs font-medium text-gray-300">
                <Paperclip className="w-3.5 h-3.5 text-green-400"/> {chatFile.name}
                <button onClick={()=>setChatFile(null)} className="ml-auto text-red-400 hover:text-red-300 transition p-1 hover:bg-gray-600 rounded"><X className="w-3 h-3"/></button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input type="file" id="chat-attachment" className="hidden" accept="image/*,.pdf" onChange={e=>setChatFile(e.target.files?.[0]||null)}/>
              <label htmlFor="chat-attachment" className="p-3 bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 rounded-xl cursor-pointer transition"><Paperclip className="w-5 h-5"/></label>
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendChatMessage()} onFocus={(e)=>setTimeout(()=>e.target.scrollIntoView({behavior:'smooth',block:'center'}),300)}
                disabled={(dailyLimit - dailyMsgCount) <= 0}
                className="flex-1 border border-gray-600 bg-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={(dailyLimit - dailyMsgCount) <= 0 ? 'Daily limit reached. Come back tomorrow.' : 'Ask a question...'}/>
              <button onClick={sendChatMessage} disabled={(dailyLimit - dailyMsgCount) <= 0} className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {folderModal.isOpen&&(
        <div className="fixed inset-0 bg-gray-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                {folderModal.type==='create'?<FolderPlus className="text-green-400 w-5 h-5"/>:<Edit2 className="text-blue-400 w-5 h-5"/>}
                {folderModal.type==='create'?'New Folder':'Edit Folder'}
              </h3>
              <button onClick={()=>setFolderModal({...folderModal,isOpen:false})} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Folder Emoji</label>
                <input type="text" maxLength={2} value={folderModal.emoji} onChange={e=>setFolderModal({...folderModal,emoji:e.target.value})} className="w-full text-center text-3xl bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 text-white"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Folder Name</label>
                <input type="text" value={folderModal.name} onChange={e=>setFolderModal({...folderModal,name:e.target.value})} placeholder="e.g. Science 101" className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 text-white font-bold"/>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={handleSaveFolder} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition">{folderModal.type==='create'?'Create Folder':'Save Changes'}</button>
                {folderModal.type==='edit'&&folderModal.folderId&&(
                  <button onClick={()=>deleteFolder(folderModal.folderId!)} className="w-full py-3 bg-red-900/30 text-red-400 rounded-xl font-bold hover:bg-red-900/50 transition">Delete Folder</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {addContextModalOpen&&(
        <div className="fixed inset-0 bg-gray-900/70 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-700 overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-indigo-900/20">
              <div>
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2"><Network className="text-indigo-400 w-6 h-6"/> Add Context (Pro)</h3>
                <p className="text-xs text-indigo-300 mt-1">Provide more material for AI to merge into these notes. Podcast will also be updated.</p>
              </div>
              <button onClick={()=>setAddContextModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-900/50 p-1.5 rounded-[20px] flex flex-col sm:flex-row gap-1 mb-6 border border-gray-700">
                <button onClick={()=>setContextInputMode('pdf')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode==='pdf'?'bg-indigo-600 text-white shadow-md':'bg-transparent text-gray-400 hover:bg-gray-700'}`}><FileUp className="w-4 h-4"/> PDF</button>
                <button onClick={()=>setContextInputMode('voice')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode==='voice'?'bg-indigo-600 text-white shadow-md':'bg-transparent text-gray-400 hover:bg-gray-700'}`}><Mic className="w-4 h-4"/> Text/Dictate</button>
                <button onClick={()=>setContextInputMode('link')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode==='link'?'bg-indigo-600 text-white shadow-md':'bg-transparent text-gray-400 hover:bg-gray-700'}`}><LinkIcon className="w-4 h-4"/> YouTube URL</button>
              </div>
              {contextInputMode==='pdf'&&(
                <div className="text-center border-2 border-dashed border-gray-600 rounded-[24px] p-8 bg-gray-900/30">
                  <input type="file" id="context-pdf" multiple accept=".pdf" className="hidden" onChange={(e)=>{const files=Array.from(e.target.files||[]);setContextPdfFiles(prev=>[...prev,...files]);}}/>
                  <label htmlFor="context-pdf" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl cursor-pointer font-bold inline-flex items-center gap-2 transition"><FileUp className="w-4 h-4"/> Select PDFs</label>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {contextPdfFiles.map((file,i)=>(
                      <span key={i} className="bg-indigo-900/40 text-indigo-300 text-xs px-3 py-1.5 rounded-full font-bold border border-indigo-800 flex items-center gap-2">
                        {file.name}<button onClick={()=>setContextPdfFiles(contextPdfFiles.filter((_,idx)=>idx!==i))} className="hover:text-red-400"><X className="w-3 h-3"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {contextInputMode==='voice'&&<textarea value={contextVoiceText} onChange={e=>setContextVoiceText(e.target.value)} className="w-full h-48 p-4 border border-gray-600 rounded-2xl focus:outline-none focus:border-indigo-500 bg-gray-900 text-white" placeholder="Type or dictate additional context..."/>}
              {contextInputMode==='link'&&<input type="text" id="context-url-input" onFocus={(e)=>setTimeout(()=>e.target.scrollIntoView({behavior:'smooth',block:'center'}),300)} className="w-full border border-gray-600 rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 bg-gray-900 text-white" placeholder="Paste a YouTube URL here..."/>}
            </div>
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <button onClick={handleAddContext} disabled={isAddingContextLoading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isAddingContextLoading?<RefreshCw className="w-5 h-5 animate-spin"/>:<Network className="w-5 h-5"/>}
                {isAddingContextLoading?'Integrating into Notes...':'Integrate Context'}
              </button>
            </div>
          </div>
        </div>
      )}

      {translateModalOpen&&(
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-extrabold text-xl text-white flex items-center gap-2"><Languages className="text-blue-400"/> Translate Study Set</h3><button onClick={()=>setTranslateModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4">
              {translateProgress>=0?(
                <div className="space-y-3 py-4">
                  <div className="flex justify-between text-sm text-gray-300 font-bold"><span>Translating all content...</span><span>{Math.round(translateProgress)}%</span></div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden"><div className="bg-blue-500 h-3 transition-all duration-300" style={{width:`${translateProgress}%`}}></div></div>
                </div>
              ):(
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Translate entire document to:</label>
                    <select id="translate-language" className="w-full border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-gray-700 font-medium text-white">
                      <option value="Urdu">اردو — Urdu</option><option value="Arabic">عربي — Arabic</option><option value="French">Français — French</option><option value="Spanish">Español — Spanish</option><option value="German">Deutsch — German</option>
                    </select>
                  </div>
                  <button onClick={translateNotes} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"><Languages className="w-4 h-4"/> Translate Now</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {askModalOpen&&(
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-extrabold text-xl text-white flex items-center gap-2"><MessageCircleQuestion className="text-indigo-400"/> Audio Q&A with Professor</h3>
              <button onClick={()=>{isAskModalOpenRef.current=false;setAskModalOpen(false);stopProfSpeaking();}} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center">
              <p className="text-sm text-gray-400 mb-8 text-center">Tap the microphone and ask your question aloud.</p>
              <button onClick={toggleAskRecording} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${isAskRecording?'bg-red-500 animate-pulse':'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'}`}>
                {isAskRecording?<Square className="w-10 h-10 text-white"/>:<Mic className="w-10 h-10 text-white"/>}
              </button>
              <div className="mt-4 font-bold text-lg text-white">{isAskRecording?'Listening... Tap to stop':'Tap to start recording'}</div>
              {askResponse&&(
                <div className="mt-8 w-full bg-indigo-900/20 border border-indigo-800/50 p-5 rounded-xl text-left animate-slide-in relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src="/hazelnote_tutor.png" className="w-6 h-6 rounded-full object-cover bg-white"/>
                      <span className="text-indigo-300 font-bold text-sm">Professor Hazel</span>
                    </div>
                    {isProfSpeaking&&(
                      <button onClick={stopProfSpeaking} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-bold bg-red-900/30 px-2 py-1 rounded">
                        <StopCircle className="w-4 h-4"/> Stop
                      </button>
                    )}
                  </div>
                  <div className="text-gray-200 text-sm leading-relaxed" dangerouslySetInnerHTML={{__html:askResponse}}/>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {goProModalOpen&&(
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8 text-white"/></div>
            <h3 className="text-2xl font-extrabold text-white mb-3">Upgrade to Pro</h3>
            <p className="text-gray-400 mb-6">
              {tier==='free'&&(stats.monthlySets?.[getCurrentMonth()]||0)>=2
                ? "You've reached your monthly limit of 2 study sets."
                : 'Unlock unlimited study sets, advanced editing, and more!'}
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setGoProModalOpen(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold">Maybe Later</button>
              <Link href="/pricing/" onClick={()=>setGoProModalOpen(false)} className="flex-1 py-3 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-xl font-bold flex items-center justify-center">View Plans</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white font-bold">Loading Dashboard...</div>}>
      <DashboardContent/>
    </Suspense>
  );
}
