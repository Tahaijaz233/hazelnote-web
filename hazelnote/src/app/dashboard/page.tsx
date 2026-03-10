'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  UserCircle,
  HelpCircle,
  Menu,
  X,
  Flame,
  FileCheck2,
  Sparkles,
  FileUp,
  Mic,
  Link as LinkIcon,
  FileText,
  Loader2,
  ArrowLeft,
  Printer,
  Languages,
  Send,
  CheckCircle,
  Trash2,
  Wand2,
  Play,
  Square,
  Headphones,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Table,
  FunctionSquare,
  MessageSquare,
  Save,
  RefreshCw,
  Monitor,
  Phone,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { StudySet, UserStats } from '@/types';
import { safeParseJSON, saveToStorage, renderMarkdownWithMath, getCurrentMonth } from '@/lib/utils';

// Note editor toolbar component for Pro users
const NoteEditorToolbar = ({ 
  onFormat, 
  onInsertMath, 
  onInsertImage, 
  onInsertTable, 
  onAddComment,
  fontSize,
  setFontSize,
  fontColor,
  setFontColor,
  highlightColor,
  setHighlightColor,
}: {
  onFormat: (format: string) => void;
  onInsertMath: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
  onAddComment: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontColor: string;
  setFontColor: (color: string) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
}) => {
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#FFC0CB'];
  const highlightColors = ['transparent', '#FFFF00', '#00FFFF', '#FF00FF', '#90EE90', '#FFB6C1'];

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-2 shadow-sm">
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <select 
          value={fontSize} 
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 dark:text-white"
        >
          <option value={12}>12px</option>
          <option value={14}>14px</option>
          <option value={16}>16px</option>
          <option value={18}>18px</option>
          <option value={20}>20px</option>
          <option value={24}>24px</option>
        </select>
      </div>
      
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button onClick={() => onFormat('bold')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => onFormat('italic')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => onFormat('underline')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Underline">
          <Underline className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <span className="text-xs text-gray-500">Color:</span>
        <div className="flex gap-1">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setFontColor(c)}
              className={`w-5 h-5 rounded-full border ${fontColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <span className="text-xs text-gray-500">Highlight:</span>
        <div className="flex gap-1">
          {highlightColors.map(c => (
            <button
              key={c}
              onClick={() => setHighlightColor(c)}
              className={`w-5 h-5 rounded-full border ${highlightColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${c === 'transparent' ? 'bg-gray-200' : ''}`}
              style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
            >
              {c === 'transparent' && <span className="text-xs">✕</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onInsertMath} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 text-sm" title="Insert Math">
          <FunctionSquare className="w-4 h-4" /> Math
        </button>
        <button onClick={onInsertImage} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 text-sm" title="Insert Image">
          <ImageIcon className="w-4 h-4" /> Image
        </button>
        <button onClick={onInsertTable} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 text-sm" title="Insert Table">
          <Table className="w-4 h-4" /> Table
        </button>
        <button onClick={onAddComment} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 text-sm" title="Add Comment">
          <MessageSquare className="w-4 h-4" /> Comment
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'study'>('dashboard');
  const [currentTab, setCurrentTab] = useState<'notes' | 'flashcards' | 'quiz' | 'podcast'>('notes');
  const [inputMode, setInputMode] = useState<'pdf' | 'voice' | 'link'>('pdf');
  
  // State changes: Store raw File objects
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [webText, setWebText] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState('Analyzing document structure...');
  const [currentStudySet, setCurrentStudySet] = useState<StudySet | null>(null);
  const [studyHistory, setStudyHistory] = useState<StudySet[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 0, notes: 0, lastDate: null, monthlySets: {} });
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Podcast state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pro note editing state
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  
  // Modals
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [goProModalOpen, setGoProModalOpen] = useState(false);

  // Loading tips
  const loadingTips = [
    'Uploading files to secure storage...',
    'Analyzing document structure...',
    'Extracting key concepts & definitions...',
    'Formatting Markdown tables...',
    'Formulating intelligent practice questions...',
    'Structuring audio podcast script...',
    'Finalizing study workspace...',
    'Cleaning up temporary storage...',
  ];

  // Initialize
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const p = snap.data();
          setProfile(p);
          setTier(p.is_pro ? 'pro' : 'free');
          
          if (p.is_pro) {
            syncFromFirebase(u.uid);
          }
        }
      }
    });

    setStudyHistory(safeParseJSON('hz_study_history', []));
    setStats(safeParseJSON('hz_stats', { streak: 0, notes: 0, lastDate: null, monthlySets: {} }));

    return () => unsubscribe();
  }, []);

  const syncFromFirebase = async (userId: string) => {
    try {
      setSyncStatus('syncing');
      const studySetsRef = collection(db, 'studySets');
      const q = query(studySetsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const firebaseSets: StudySet[] = [];
      querySnapshot.forEach((doc) => {
        firebaseSets.push(doc.data() as StudySet);
      });
      
      if (firebaseSets.length > 0) {
        const localSets = safeParseJSON('hz_study_history', []);
        const mergedSets = [...firebaseSets, ...localSets.filter((ls: StudySet) => 
          !firebaseSets.some((fs: StudySet) => fs.id === ls.id)
        )].slice(0, 50);
        
        setStudyHistory(mergedSets);
        saveToStorage('hz_study_history', mergedSets);
      }
      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync failed:', e);
      setSyncStatus('offline');
    }
  };

  const syncToFirebase = async (studySet: StudySet) => {
    if (!user || tier !== 'pro') return;
    try {
      setSyncStatus('syncing');
      const studySetRef = doc(db, 'studySets', `${user.uid}_${studySet.id}`);
      await setDoc(studySetRef, {
        ...studySet,
        userId: user.uid,
        syncedAt: serverTimestamp(),
      });
      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync to Firebase failed:', e);
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    const today = new Date().toDateString();
    if (stats.lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (stats.lastDate !== yesterday.toDateString() && stats.lastDate !== null) {
        setStats(prev => ({ ...prev, streak: 0 }));
      }
    }
  }, [stats.lastDate]);

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Size limit based on tier
    const maxMB = tier === 'pro' ? 100 : 10;
    const newFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxMB * 1024 * 1024) {
        alert(`File ${file.name} exceeds your limit of ${maxMB}MB. ${tier === 'free' ? 'Upgrade to Pro to upload up to 100MB!' : ''}`);
        continue;
      }
      newFiles.push(file);
    }

    setPdfFiles(prev => [...prev, ...newFiles]);
  };

  const removePDF = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const callLLM = async (systemPrompt: string, userText: string, pdfUrls?: string[]) => {
    const payload: any = { systemPrompt, userText };

    if (pdfUrls && pdfUrls.length > 0) {
      payload.pdfUrls = pdfUrls;
    }

    const res = await fetch('/api/gemini/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const textResponse = await res.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      throw new Error(`Server returned an invalid response (${res.status}). Error: ${textResponse.substring(0, 50)}...`);
    }

    if (data.error) {
      if (data.error.toLowerCase().includes('quota')) {
        throw new Error('API_QUOTA_EXCEEDED');
      }
      throw new Error(data.error);
    }

    return data.result;
  };

  const generateStudySet = async () => {
    if (tier === 'free') {
      const month = getCurrentMonth();
      const count = stats.monthlySets[month] || 0;
      if (count >= 2) {
        setGoProModalOpen(true);
        return;
      }
    }

    let finalContext = '';
    let uploadedRefs: any[] = [];
    let uploadedUrls: string[] = [];
    
    // Initial validation
    if (inputMode === 'link') {
      const urlInput = document.getElementById('youtube-url-input') as HTMLInputElement;
      if (!urlInput?.value) return alert('Please paste a YouTube URL to begin.');
    } else if (inputMode === 'pdf') {
      if (pdfFiles.length === 0) return alert('Please upload a PDF to begin.');
    } else if (inputMode === 'voice') {
      if (!voiceText.trim()) return alert('Please dictate or type notes to begin.');
      finalContext += '\n' + voiceText;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    
    let progress = 0;
    let tipIndex = 0;
    const progressInterval = setInterval(() => {
      if (progress < 95) {
        progress += Math.random() * 3;
        setLoadingProgress(Math.min(95, progress));
      }
    }, 400);
    const tipInterval = setInterval(() => {
      tipIndex = (tipIndex + 1) % loadingTips.length;
      setLoadingTip(loadingTips[tipIndex]);
    }, 3000);

    try {
      // Input Logic Phase
      if (inputMode === 'link') {
        setLoadingTip('Fetching YouTube transcript...');
        const urlInput = document.getElementById('youtube-url-input') as HTMLInputElement;
        const ytRes = await fetch('/api/youtube/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput.value })
        });
        const ytData = await ytRes.json();
        if (ytData.error) throw new Error(ytData.error);
        finalContext += '\n' + ytData.text;
      } 
      else if (inputMode === 'pdf') {
        setLoadingTip('Uploading documents to secure storage...');
        for (const file of pdfFiles) {
          const storageRef = ref(storage, `temp_uploads/${user?.uid || 'guest'}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          uploadedRefs.push(storageRef);
          uploadedUrls.push(url);
          finalContext += `\n[Attached Document: ${file.name}]\n`;
        }
      }

      const flashcardCount = tier === 'pro' ? 15 : 5;
      const quizCount = tier === 'pro' ? 10 : 3;

      const mainPrompt = `You are an expert tutor and instructional designer. Create highly structured, comprehensive study materials from this content. You MUST generate EXACTLY 5 sections separated by exactly "===SPLIT===". Do NOT deviate from this structure.

CRITICAL FORMATTING RULES:
- Output ONLY the raw requested text for each section. 
- NO conversational filler.
- For math notation, use LaTeX format: inline math with $formula$ and block math with $$formula$$

Section 1: Write a SHORT TITLE (4-8 words max) summarizing the specific topic.
===SPLIT===
Section 2: Write an EXECUTIVE SUMMARY (exactly 250 words) giving a high-level overview.
===SPLIT===
Section 3: Write DETAILED NOTES in Markdown format.
   - Use ## for main sections, ### for subsections.
   - You MUST include Markdown tables to organize data where applicable.
   - Use bullet points and **bold** text extensively.
   - MATH NOTATION: For inline math use $formula$, for block use $$formula$$
===SPLIT===
Section 4: Create exactly ${flashcardCount} FLASHCARDS.
Format strictly like this, replacing brackets with content:
QUESTION: [Question that tests understanding]
ANSWER: [Detailed answer]
===SPLIT===
Section 5: Create exactly ${quizCount} QUIZ QUESTIONS.
Format strictly like this:
QUESTION: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
ANSWER: [A/B/C/D]

Ensure you output EXACTLY 5 parts using "===SPLIT===" as the separator.`;

      setLoadingTip('Synthesizing study set via Gemini AI...');
      const mainResult = await callLLM(mainPrompt, finalContext, uploadedUrls);
      let parts = mainResult.split('===SPLIT===').map((p: string) => p.trim());
      while (parts.length < 5) {
        parts.push('Content generation incomplete. Please regenerate.');
      }

      let summaryClean = (parts[1] || '').trim();
      summaryClean = summaryClean.replace(/^(Here are the comprehensive.*?:?\s*|Here is the summary.*?:?\s*|SUMMARY:?\s*|\*\*SUMMARY\*\*:?\s*)/is, '').trim();
      parts[1] = summaryClean;

      const podPrompt = `Convert this content into a teaching monologue for an audio podcast. 
IMPORTANT RULES:
- Use short, clear sentences
- Conversational and engaging tone
- NO stage directions, emotions, or sound effects
- NO asterisks, brackets, or special characters
- Just plain text that can be read aloud naturally

Content: ${parts[1] || finalContext.substring(0, 3000)}`;
      
      const podResult = await callLLM(podPrompt, '');
      const cleanPodResult = podResult
        .replace(/\*[^*]*\*/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setLoadingProgress(100);

      const studySet: StudySet = {
        id: Date.now(),
        title: parts[0]?.replace(/^(Title:|Here is.*?|Study Set:?|\*\*.*?:\*\*|Section 1:?)\s*/i, '').replace(/[*#]/g, '').trim().substring(0, 100) || `Study Set - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        summary: (parts[1] || '').substring(0, 200) + '...',
        flashcardCount,
        quizCount,
        parts,
        podcast: cleanPodResult,
        chatCount: 0,
      };

      const newHistory = [studySet, ...studyHistory].slice(0, 50);
      setStudyHistory(newHistory);
      saveToStorage('hz_study_history', newHistory);

      if (tier === 'pro') {
        await syncToFirebase(studySet);
      }

      const today = new Date().toDateString();
      const newStats = { ...stats };
      if (newStats.lastDate !== today) {
        newStats.streak += 1;
        newStats.lastDate = today;
      }
      newStats.notes += 1;
      const month = getCurrentMonth();
      newStats.monthlySets[month] = (newStats.monthlySets[month] || 0) + 1;
      setStats(newStats);
      saveToStorage('hz_stats', newStats);

      setIsLoading(false);
      loadStudySet(studySet);
      
    } catch (e: any) {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setIsLoading(false);
      alert('Error: ' + e.message);
    } finally {
      // CLEANUP: Always delete the temporary storage files after generation is done
      if (uploadedRefs.length > 0) {
        for (const storageRef of uploadedRefs) {
          try {
            await deleteObject(storageRef);
          } catch (e) {
            console.warn('Failed to clean up temporary Firebase storage file', e);
          }
        }
      }
    }
  };

  const loadStudySet = (studySet: StudySet) => {
    setCurrentStudySet(studySet);
    setEditedNotes(studySet.parts[2] || '');
    setChatMessages([{ role: 'ai', text: `Hi! I'm Professor Hazel. I've analyzed <b>${studySet.title}</b>. How can I help you study today?` }]);
    setCurrentView('study');
    setCurrentTab('notes');
  };

  const deleteStudySet = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = studyHistory.filter(s => s.id !== id);
    setStudyHistory(newHistory);
    saveToStorage('hz_study_history', newHistory);
    if (stats.notes > 0) {
      const newStats = { ...stats, notes: stats.notes - 1 };
      setStats(newStats);
      saveToStorage('hz_stats', newStats);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentStudySet) return;

    if (tier === 'free' && currentStudySet.chatCount >= 3) {
      setGoProModalOpen(true);
      return;
    }

    const text = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');

    if (tier === 'free') {
      const updatedSet = { ...currentStudySet, chatCount: (currentStudySet.chatCount || 0) + 1 };
      setCurrentStudySet(updatedSet);
      const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
      setStudyHistory(newHistory);
      saveToStorage('hz_study_history', newHistory);
    }

    setChatMessages(prev => [...prev, { role: 'ai', text: '<span class="animate-pulse">Reading your notes...</span>' }]);

    try {
      const context = currentStudySet.parts.join('\n');
      const prompt = `You are Professor Hazel, a helpful AI tutor for HazelNote. 
Use the provided Study Material to answer the user's question accurately. 
If the user asks to rewrite, shorten, or expand the notes, generate the requested content formatted cleanly in Markdown. 
Always base your answers strictly on the provided material unless asked a general conceptual question.

Study Material:
${context}`;

      const response = await callLLM(prompt, text);
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', text: renderMarkdownWithMath(response) };
        return newMsgs;
      });
    } catch (e: any) {
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', text: `<span class="text-red-500">Error: ${e.message}</span>` };
        return newMsgs;
      });
    }
  };

  const translateNotes = async () => {
    if (!currentStudySet) return;
    const langSelect = document.getElementById('translate-language') as HTMLSelectElement;
    const lang = langSelect?.value || 'Urdu';
    setTranslateModalOpen(false);
    
    try {
      const content = currentStudySet.parts.join('\n===SPLIT===\n');
      const prompt = `Translate this entire study set into ${lang}. Maintain ALL the '===SPLIT===' separators exactly as they are. Translate the text inside each section. Keep markdown formatting.`;
      const result = await callLLM(prompt, content);
      const newParts = result.split('===SPLIT===').map((p: string) => p.trim());

      const newSet: StudySet = {
        ...currentStudySet,
        id: Date.now(),
        title: `${currentStudySet.title} (${lang})`,
        parts: newParts,
        date: new Date().toISOString(),
      };

      const newHistory = [newSet, ...studyHistory].slice(0, 50);
      setStudyHistory(newHistory);
      saveToStorage('hz_study_history', newHistory);
      
      if (tier === 'pro') await syncToFirebase(newSet);
      loadStudySet(newSet);
    } catch (e: any) {
      alert('Translation failed: ' + e.message);
    }
  };

  const EDGE_TTS_VOICES = [
    { name: 'en-US-AriaNeural', label: 'Aria (US Female)' },
    { name: 'en-US-GuyNeural', label: 'Guy (US Male)' },
    { name: 'en-GB-SoniaNeural', label: 'Sonia (UK Female)' },
    { name: 'en-GB-RyanNeural', label: 'Ryan (UK Male)' },
    { name: 'en-AU-NatashaNeural', label: 'Natasha (AU Female)' },
  ];

  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural');

  const togglePodcast = async () => {
    if (!currentStudySet?.podcast) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const lines = currentStudySet.podcast.split(/[.!?]+/).filter(l => l.trim().length > 10);
    setIsPlaying(true);

    const speakLine = (index: number) => {
      if (index >= lines.length) {
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(lines[index]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US');
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => speakLine(index + 1);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    };
    speakLine(0);
  };

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const renderFlashcards = (text: string) => {
    if (!text || text.includes('incomplete')) return <p className="text-gray-500">No flashcards generated.</p>;
    const regex = /QUESTION:\s*([\s\S]*?)\s*ANSWER:\s*([\s\S]*?)(?=QUESTION:|$)/gi;
    const cards: { question: string; answer: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      cards.push({ question: match[1].trim(), answer: match[2].trim() });
    }
    if (cards.length === 0) {
      const oldRegex = /FRONT:\s*([\s\S]*?)\s*BACK:\s*([\s\S]*?)(?=FRONT:|$)/gi;
      while ((match = oldRegex.exec(text)) !== null) {
        cards.push({ question: match[1].trim(), answer: match[2].trim() });
      }
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="flip-card" onClick={(e) => e.currentTarget.classList.toggle('flipped')}>
            <div className="flip-card-inner">
              <div className="flip-card-front bg-gray-800/50 backdrop-blur-lg border border-gray-700" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(card.question) }} />
              <div className="flip-card-back" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(card.answer) }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuiz = (text: string) => {
    if (!text || text.includes('incomplete')) return <p className="text-gray-500">No quiz generated.</p>;
    const regex = /QUESTION:\s*([\s\S]*?)\s*A\)\s*([\s\S]*?)\s*B\)\s*([\s\S]*?)\s*C\)\s*([\s\S]*?)\s*D\)\s*([\s\S]*?)\s*ANSWER:\s*([A-D])/gi;
    const questions: { q: string; opts: string[]; answer: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      questions.push({
        q: match[1].trim(),
        opts: [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()],
        answer: match[6].trim().toUpperCase(),
      });
    }

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 p-6 rounded-2xl">
            <h4 className="font-bold text-gray-100 mb-4">{i + 1}. {q.q}</h4>
            <div className="space-y-2">
              {q.opts.map((opt, j) => {
                const letter = String.fromCharCode(65 + j);
                const isCorrect = letter === q.answer;
                return (
                  <label key={j} className="flex items-center gap-3 p-3 border border-gray-600 rounded-xl cursor-pointer hover:bg-gray-700/50 transition quiz-option-lbl" data-is-correct={isCorrect}>
                    <input type="radio" name={`quiz_q_${i}`} value={letter} className="accent-green-500" onChange={(e) => {
                      const container = e.target.closest('.space-y-2');
                      const labels = container?.querySelectorAll('.quiz-option-lbl');
                      labels?.forEach((l: any) => {
                        l.style.pointerEvents = 'none';
                        if (l.getAttribute('data-is-correct') === 'true') {
                          l.classList.remove('border-gray-600');
                          l.classList.add('bg-green-900/30', 'border-green-500');
                        } else if (l.querySelector('input')?.checked) {
                          l.classList.remove('border-gray-600');
                          l.classList.add('bg-red-900/30', 'border-red-500');
                        }
                      });
                    }} />
                    <span className="text-gray-200"><b>{letter}.</b> {opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleOpenChat = () => { setSidebarCollapsed(true); setChatOpen(true); };
  const handleCloseChat = () => { setChatOpen(false); setSidebarCollapsed(false); };
  const handleFormat = (format: string) => document.execCommand(format, false);
  const handleInsertMath = () => { const mathInput = prompt('Enter LaTeX math (e.g., E = mc^2):'); if (mathInput) document.execCommand('insertText', false, ` $${mathInput}$ `); };
  const handleInsertImage = () => { const imageUrl = prompt('Enter image URL:'); if (imageUrl) document.execCommand('insertImage', false, imageUrl); };
  const handleInsertTable = () => {
    const rows = parseInt(prompt('Number of rows:', '3') || '3');
    const cols = parseInt(prompt('Number of columns:', '3') || '3');
    let tableHtml = '<table class="border-collapse border border-gray-400 my-4"><tbody>';
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) tableHtml += '<td class="border border-gray-400 p-2">Cell</td>';
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    document.execCommand('insertHTML', false, tableHtml);
  };
  const handleAddComment = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      const comment = prompt('Add your comment:');
      if (comment) document.execCommand('insertHTML', false, `<span class="bg-yellow-200 dark:bg-yellow-700" title="${comment}">${selection}</span>`);
    }
  };

  const saveEditedNotes = async () => {
    if (!currentStudySet) return;
    const updatedParts = [...currentStudySet.parts];
    updatedParts[2] = editedNotes;
    const updatedSet = { ...currentStudySet, parts: updatedParts };
    setCurrentStudySet(updatedSet);
    const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
    setStudyHistory(newHistory);
    saveToStorage('hz_study_history', newHistory);
    if (tier === 'pro') await syncToFirebase(updatedSet);
    setIsEditing(false);
  };

  const Sidebar = () => (
    <aside className={`bg-gray-900 border-r border-gray-800 flex flex-col h-full z-50 fixed md:sticky top-0 left-0 transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${sidebarCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'w-72'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-white leading-none">HazelNote</h1>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">by free-ed</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-800 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <button onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} className={`w-full text-left sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}>
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>
        <button onClick={() => { setCurrentView('create'); setSidebarOpen(false); }} className={`w-full text-left sidebar-item ${currentView === 'create' ? 'active' : ''}`}>
          <PlusCircle className="w-5 h-5" /> Create Notes
        </button>
        <Link href="/exam/" className="w-full text-left sidebar-item flex items-center gap-3">
          <ClipboardList className="w-5 h-5" /> Take an Exam
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-1">
        {tier === 'free' && (
          <div className="mb-2">
            <button onClick={() => setGoProModalOpen(true)} className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">
              ⚡ Upgrade to Pro
            </button>
          </div>
        )}
        {tier === 'pro' && (
          <div className="mb-2 px-3 py-2 bg-green-900/30 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Save className="w-3 h-3" />
              <span>Pro Plan Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</span>
            </div>
          </div>
        )}
        <Link href="/profile/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-400 hover:text-white">
          <UserCircle className="w-5 h-5" /> Profile & Settings
        </Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-400 hover:text-white">
          <HelpCircle className="w-5 h-5" /> Support
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />}
      <Sidebar />
      <main className={`flex-1 h-full overflow-y-auto relative transition-all duration-300 ${sidebarCollapsed ? 'md:ml-0' : ''}`}>
        <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2">
          <Menu className="w-5 h-5" /> <span className="text-sm font-medium">Menu</span>
        </button>

        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-lg text-white">HazelNote</span>
          </div>
        </div>

        {currentView === 'dashboard' && (
          <div className="p-6 md:p-8 max-w-5xl mx-auto pt-8 md:pt-12">
            <header className="mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Welcome back! 👋</h2>
              <p className="text-gray-400 text-lg">Track your progress and continue learning.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glass-card p-6 flex items-center gap-5 transition hover:shadow-lg bg-gray-800/50 backdrop-blur-lg border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-green-900/40 flex items-center justify-center text-green-400"><Flame className="w-7 h-7" /></div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Study Streak</p>
                  <p className="text-3xl font-extrabold text-white">{stats.streak} <span className="text-lg text-gray-500 font-medium">Days</span></p>
                </div>
              </div>
              <div className="glass-card p-6 flex items-center gap-5 transition hover:shadow-lg bg-gray-800/50 backdrop-blur-lg border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-blue-900/40 flex items-center justify-center text-blue-400"><FileCheck2 className="w-7 h-7" /></div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Notes Generated</p>
                  <p className="text-3xl font-extrabold text-white">{stats.notes}</p>
                </div>
              </div>
              {tier === 'free' && (
                <div className="glass-card p-6 flex items-center gap-5 transition hover:shadow-lg bg-gray-800/50 backdrop-blur-lg border-gray-700">
                  <div className="w-14 h-14 rounded-2xl bg-purple-900/40 flex items-center justify-center text-purple-400"><Sparkles className="w-7 h-7" /></div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Monthly Sets</p>
                    <p className="text-3xl font-extrabold text-white">{stats.monthlySets?.[getCurrentMonth()] || 0}<span className="text-lg text-gray-500 font-medium">/2</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden bg-gray-800/50 backdrop-blur-lg border-gray-700">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400"><Sparkles className="w-10 h-10" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to learn something new?</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload PDFs, dictate voice notes, or paste YouTube URLs to generate your next study set.</p>
              <button onClick={() => setCurrentView('create')} className="btn-primary px-10 py-4 text-lg shadow-xl">Create New Study Set</button>
            </div>

            <div className="mt-10">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-white">Recent Study Sets</h3></div>
              <div className="space-y-4">
                {studyHistory.length === 0 ? <p className="text-gray-500 text-center py-8">No study sets yet. Create your first one!</p> : (
                  studyHistory.slice(0, 10).map((set) => (
                    <div key={set.id} onClick={() => loadStudySet(set)} className="glass-card p-5 hover:shadow-lg transition cursor-pointer bg-gray-800/50 backdrop-blur-lg border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white flex-1 mr-2">{set.title}</h4>
                        <div className="flex gap-2">
                          <button onClick={(e) => deleteStudySet(set.id, e)} className="text-gray-500 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{set.summary}</p>
                      <div className="flex gap-3 text-xs flex-wrap">
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full font-medium">{set.flashcardCount} Cards</span>
                        <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-full font-medium">{set.quizCount} Questions</span>
                        <span className="text-gray-500">{new Date(set.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'create' && !isLoading && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center tracking-tight">What are we studying today?</h2>
            
            <div className="glass-card p-2 rounded-[32px] flex flex-col md:flex-row gap-2 mb-10 mx-auto max-w-2xl bg-gray-800/50 backdrop-blur-lg border-gray-700">
              <button onClick={() => setInputMode('pdf')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'pdf' ? 'bg-green-500 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><FileUp className="w-4 h-4" /> PDF Upload</button>
              <button onClick={() => setInputMode('voice')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'voice' ? 'bg-green-500 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><Mic className="w-4 h-4" /> Voice Record</button>
              <button onClick={() => setInputMode('link')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'link' ? 'bg-green-500 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><LinkIcon className="w-4 h-4" /> YouTube</button>
            </div>

            {inputMode === 'pdf' && (
              <div className="glass-card p-8 md:p-12 text-center border-2 border-dashed border-gray-600 bg-gray-800/50 backdrop-blur-lg">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Upload Multiple PDFs</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">Upload documents to be processed by Gemini AI. Limit: {tier === 'pro' ? '100MB' : '10MB'} per file.</p>
                <input type="file" id="pdf-upload" multiple accept=".pdf" className="hidden" onChange={handlePDFUpload} />
                <label htmlFor="pdf-upload" className="btn-primary px-10 py-4 cursor-pointer inline-block shadow-lg text-lg">Browse Files</label>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  {pdfFiles.map((file, i) => (
                    <span key={i} className="bg-green-900/40 text-green-400 text-xs px-4 py-2 rounded-full font-bold border border-green-800 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      <button onClick={() => removePDF(i)} className="hover:text-red-400 transition ml-1 bg-green-800/50 hover:bg-red-900/50 p-1 rounded-full"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {inputMode === 'voice' && (
              <div className="glass-card p-8 md:p-12 text-center bg-gray-800/50 backdrop-blur-lg border-gray-700">
                <textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} className="w-full h-40 p-5 border border-gray-600 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-700 text-white text-base" placeholder="Type or dictate your notes..." />
              </div>
            )}

            {inputMode === 'link' && (
              <div className="glass-card p-8 md:p-10 bg-gray-800/50 backdrop-blur-lg border-gray-700">
                <div className="flex flex-col gap-3 mb-4">
                  <input type="text" id="youtube-url-input" className="flex-1 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 bg-gray-700 text-white text-sm font-medium" placeholder="Paste a YouTube URL here..." />
                </div>
                <p className="text-sm text-gray-400 mb-4">Enter a YouTube URL and click Generate to automatically fetch the transcript and create a study set.</p>
              </div>
            )}

            <div className="mt-10 text-center">
              <button onClick={generateStudySet} className="btn-primary px-10 md:px-16 py-4 md:py-5 text-lg md:text-xl shadow-xl w-full md:w-auto flex items-center justify-center gap-3 mx-auto">
                <Wand2 className="w-5 h-5" /> Generate Study Set
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="max-w-2xl mx-auto mt-10 text-center p-8 md:p-12">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-700"></circle>
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * loadingProgress / 100)} className="text-green-500 transition-all duration-300 ease-out glow-animation-stroke" strokeLinecap="round"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-extrabold text-white tracking-tighter">{Math.round(loadingProgress)}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">Synthesizing Knowledge...</h3>
            <div className="h-10 flex items-center justify-center">
              <p className="text-sm font-medium text-green-400 bg-green-900/30 px-5 py-2.5 rounded-full border border-green-800 shadow-sm transition-opacity duration-300">
                {loadingTip}
              </p>
            </div>
          </div>
        )}

        {currentView === 'study' && currentStudySet && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 pt-6 md:pt-10">
            <div className="mb-6 flex justify-between items-center">
              <button onClick={() => setCurrentView('dashboard')} className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>
            
            <div className="glass-card overflow-hidden bg-gray-800/50 backdrop-blur-lg border-gray-700">
              <div className="border-b border-gray-700 bg-gray-800/50">
                <div className="p-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{currentStudySet.title}</h2>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onClick={() => window.print()} className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-gray-600 shadow-sm"><Printer className="w-4 h-4" /> Export PDF</button>
                    <button onClick={() => setTranslateModalOpen(true)} className="text-sm bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-blue-800 shadow-sm"><Languages className="w-4 h-4" /> Translate</button>
                    <button onClick={handleOpenChat} className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md border border-green-600"><img src="/hazelnote_tutor.png" className="w-5 h-5 rounded-full object-cover bg-white border border-green-400" /> Chat with Professor</button>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-8 pt-8 -mb-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] z-10 relative">
                <div className="inline-flex p-1.5 bg-gray-800 border border-gray-700 rounded-[20px] shadow-sm gap-1 overflow-x-auto max-w-full">
                  {(['notes', 'flashcards', 'quiz', 'podcast'] as const).map((tab) => (
                    <button key={tab} onClick={() => setCurrentTab(tab)} className={`text-sm px-5 py-2.5 rounded-xl font-bold transition-all ${currentTab === tab ? 'bg-green-500 text-white shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 min-h-[600px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] study-content-area relative z-0">
                {currentTab === 'notes' && (
                  <div>
                    {tier === 'pro' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> Pro Editing Enabled</span>
                          <div className="flex gap-2">
                            {isEditing ? (
                              <><button onClick={saveEditedNotes} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"><Save className="w-3 h-3" /> Save</button><button onClick={() => setIsEditing(false)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-lg font-bold">Cancel</button></>
                            ) : (
                              <button onClick={() => setIsEditing(true)} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg font-bold flex items-center gap-1"><Type className="w-3 h-3" /> Edit Notes</button>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <NoteEditorToolbar onFormat={handleFormat} onInsertMath={handleInsertMath} onInsertImage={handleInsertImage} onInsertTable={handleInsertTable} onAddComment={handleAddComment} fontSize={fontSize} setFontSize={setFontSize} fontColor={fontColor} setFontColor={setFontColor} highlightColor={highlightColor} setHighlightColor={setHighlightColor} />
                        )}
                      </div>
                    )}
                    <div className="bg-green-900/20 p-6 md:p-8 rounded-[24px] mb-8 border border-green-800/50">
                      <h3 className="text-green-400 font-extrabold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Executive Summary</h3>
                      <div className="text-gray-200 text-lg leading-relaxed prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[1] || 'No summary available.') }} />
                    </div>
                    {isEditing && tier === 'pro' ? (
                      <div className="prose prose-lg max-w-none text-gray-200 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 min-h-[400px]" contentEditable suppressContentEditableWarning onBlur={(e) => setEditedNotes(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: editedNotes }} style={{ fontSize: `${fontSize}px`, color: fontColor }} />
                    ) : (
                      <div className="prose prose-lg max-w-none text-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[2] || 'No notes available.') }} />
                    )}
                  </div>
                )}
                
                {currentTab === 'flashcards' && <div>{renderFlashcards(currentStudySet.parts[3] || '')}</div>}
                {currentTab === 'quiz' && <div>{renderQuiz(currentStudySet.parts[4] || '')}</div>}
                
                {currentTab === 'podcast' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white text-center shadow-xl">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <Headphones className="w-10 h-10 text-white" />
                        {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Audio Lesson</h3>
                      <p className="text-indigo-200 mb-6 max-w-md mx-auto text-sm">Listen to an AI-generated teaching monologue based on your notes.</p>
                      
                      <div className="mb-6">
                        <label className="text-xs text-indigo-300 mb-2 block">Select Voice</label>
                        <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white">
                          {EDGE_TTS_VOICES.map(voice => <option key={voice.name} value={voice.name} className="text-black">{voice.label}</option>)}
                        </select>
                      </div>

                      <button onClick={togglePodcast} className="bg-white text-indigo-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto hover:scale-105 transition shadow-lg">
                        {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      </button>
                      <p className="text-xs text-indigo-300 mt-4">{isPlaying ? 'Playing... Click to stop' : 'Click to play'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {chatOpen && (
        <div className={`fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-700 transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <img src="/hazelnote_tutor.png" className="w-10 h-10 rounded-full object-cover border-2 border-green-500 bg-green-900/30" />
              <div>
                <h3 className="font-extrabold text-white text-base">Professor Hazel</h3>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs text-green-400 font-bold">Online AI Tutor</span></div>
              </div>
            </div>
            <button onClick={handleCloseChat} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900 flex flex-col">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 max-w-[90%] animate-slide-in ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? <img src="/hazelnote_tutor.png" className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-white border border-gray-600" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">U</div>}
                <div className={`p-3 text-sm rounded-2xl ${msg.role === 'ai' ? 'bg-gray-800 border border-gray-700 rounded-tl-sm shadow-sm text-gray-200' : 'bg-green-500 text-white rounded-tr-sm shadow-sm'}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-800 border-t border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              <button onClick={() => setChatInput('Rewrite these notes to be clearer.')} className="whitespace-nowrap px-4 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800 hover:bg-blue-900/50 transition">Rewrite Notes</button>
              <button onClick={() => setChatInput('Shorten these notes into a brief summary.')} className="whitespace-nowrap px-4 py-1.5 bg-green-900/30 text-green-400 text-xs font-bold rounded-full border border-green-800 hover:bg-green-900/50 transition">Shorten</button>
              <button onClick={() => setChatInput('Expand on the key concepts in these notes.')} className="whitespace-nowrap px-4 py-1.5 bg-purple-900/30 text-purple-400 text-xs font-bold rounded-full border border-purple-800 hover:bg-purple-900/50 transition">Expand Concepts</button>
            </div>
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} className="flex-1 border border-gray-600 bg-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:bg-gray-600 transition font-medium" placeholder="Ask a question about the notes..." />
              <button onClick={sendChatMessage} className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition shadow-md"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      {translateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-extrabold text-xl text-white flex items-center gap-2"><Languages className="text-blue-400" /> Translate Notes</h3>
              <button onClick={() => setTranslateModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Translate to:</label>
                <select id="translate-language" className="w-full border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-gray-700 font-medium text-white">
                  <option value="Urdu">اردو — Urdu</option>
                  <option value="Arabic">عربي — Arabic</option>
                  <option value="French">Français — French</option>
                  <option value="Spanish">Español — Spanish</option>
                  <option value="German">Deutsch — German</option>
                </select>
              </div>
              <button onClick={translateNotes} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"><Languages className="w-4 h-4" /> Translate Now</button>
            </div>
          </div>
        </div>
      )}

      {goProModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8 text-white" /></div>
            <h3 className="text-2xl font-extrabold text-white mb-3">Upgrade to Pro</h3>
            <p className="text-gray-400 mb-6">
              {tier === 'free' && stats.monthlySets?.[getCurrentMonth()] >= 2 ? "You've reached your monthly limit of 2 study sets. Upgrade to Pro for unlimited access!" : "Unlock unlimited study sets, advanced editing, device sync, and more with Pro!"}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setGoProModalOpen(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition">Maybe Later</button>
              <Link href="/pricing/" onClick={() => setGoProModalOpen(false)} className="flex-1 py-3 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition">View Pro Plans</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
