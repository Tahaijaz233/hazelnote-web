'use client';

import { useEffect, useState, useRef } from 'react';
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
  Bold,
  Italic,
  Underline,
  Type,
  Image as ImageIcon,
  Table,
  FunctionSquare,
  MessageSquare,
  Save,
  RefreshCw,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { StudySet, UserStats } from '@/types';
import { safeParseJSON, saveToStorage, renderMarkdownWithMath, getCurrentMonth } from '@/lib/utils';

// Real Rich-Text Editor Toolbar
const NoteEditorToolbar = ({ 
  onFormat, 
  onInsertMath, 
  onInsertImage, 
  onInsertTable, 
  onAddComment,
}: {
  onFormat: (command: string, value?: string) => void;
  onInsertMath: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
  onAddComment: () => void;
}) => {
  const colors = ['#000000', '#FFFFFF', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#EC4899'];
  const highlightColors = ['transparent', '#FEF08A', '#A7F3D0', '#BFDBFE', '#FBCFE8', '#E9D5FF'];

  return (
    <div className="sticky top-0 z-20 bg-gray-800/90 backdrop-blur-md border border-gray-700 p-2 flex flex-wrap items-center gap-2 shadow-sm rounded-2xl mb-4">
      <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
        <select 
          onChange={(e) => onFormat('fontSize', e.target.value)}
          className="text-sm border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white focus:outline-none"
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>
      
      <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
        <button onClick={() => onFormat('bold')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Bold"><Bold className="w-4 h-4" /></button>
        <button onClick={() => onFormat('italic')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Italic"><Italic className="w-4 h-4" /></button>
        <button onClick={() => onFormat('underline')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Underline"><Underline className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
        <span className="text-xs text-gray-400 font-medium ml-1">Text:</span>
        <div className="flex gap-1 ml-1">
          {colors.map(c => (
            <button key={`c-${c}`} onClick={() => onFormat('foreColor', c)} className="w-5 h-5 rounded-full border border-gray-600 shadow-sm hover:scale-110 transition" style={{ backgroundColor: c }} title={`Text Color ${c}`} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
        <span className="text-xs text-gray-400 font-medium ml-1">Highlight:</span>
        <div className="flex gap-1 ml-1">
          {highlightColors.map(c => (
            <button key={`h-${c}`} onClick={() => onFormat('hiliteColor', c === 'transparent' ? '#ffffff' : c)} className={`w-5 h-5 rounded-full border border-gray-600 shadow-sm hover:scale-110 transition ${c === 'transparent' ? 'bg-gray-800 flex items-center justify-center' : ''}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} title={`Highlight ${c}`}>
              {c === 'transparent' && <span className="text-[10px] text-gray-500">✕</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onInsertMath} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><FunctionSquare className="w-4 h-4 text-blue-400" /> Math</button>
        <button onClick={onInsertImage} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><ImageIcon className="w-4 h-4 text-green-400" /> Image</button>
        <button onClick={onInsertTable} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><Table className="w-4 h-4 text-orange-400" /> Table</button>
        <button onClick={onAddComment} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><MessageSquare className="w-4 h-4 text-purple-400" /> Comment</button>
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
  
  const [pdfFiles, setPdfFiles] = useState<File[]>([]); 
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  
  // Pro note editing state
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  
  // Modals
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [goProModalOpen, setGoProModalOpen] = useState(false);

  const loadingTips = [
    'Transmitting documents securely to AI Vision model...',
    'Performing advanced OCR on handwriting...',
    'Synthesizing documents into structured notes...',
    'Formatting Markdown tables...',
    'Formulating intelligent practice questions...',
    'Structuring audio podcast script...',
  ];

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

  // Fetch actual valid local system voices with priority for Neural/Edge voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoiceURI) {
        // Prioritize Edge Neural, Microsoft Online, Google, then standard system english
        const bestVoice = voices.find(v => v.name.includes('Neural') || v.name.includes('Natural')) 
                       || voices.find(v => v.name.includes('Microsoft') && v.name.includes('Online'))
                       || voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) 
                       || voices.find(v => v.lang.startsWith('en')) 
                       || voices[0];
        if (bestVoice) setSelectedVoiceURI(bestVoice.voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoiceURI]);

  const syncFromFirebase = async (userId: string) => {
    try {
      setSyncStatus('syncing');
      const studySetsRef = collection(db, 'profiles', userId, 'study_sets');
      const querySnapshot = await getDocs(studySetsRef);
      
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
      const studySetRef = doc(db, 'profiles', user.uid, 'study_sets', studySet.id.toString());
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

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxMB = tier === 'free' ? 10 : 100; 
    const MAX_SAFE_SIZE = maxMB * 1024 * 1024;
    
    const newFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_SAFE_SIZE) {
        alert(`File ${file.name} exceeds your limit of ${maxMB}MB.`);
        continue;
      }
      newFiles.push(file);
    }

    const currentTotalSize = pdfFiles.reduce((acc, file) => acc + file.size, 0);
    const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);

    if (currentTotalSize + newFilesSize > MAX_SAFE_SIZE) {
      alert(`Your plan allows a maximum of ${maxMB}MB per request. Your total upload exceeds this.`);
      return;
    }

    setPdfFiles(prev => [...prev, ...newFiles]);
  };

  const removePDF = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const callLLM = async (systemPrompt: string, userText: string, files?: File[]) => {
    if (files && files.length > 0) {
      setLoadingTip('Securing connection to Google AI servers...');
      
      const keyRes = await fetch('/api/gemini');
      const keyData = await keyRes.json();
      if (keyData.error || !keyData.apiKey) throw new Error("Could not retrieve Gemini API key");
      
      const apiKey = keyData.apiKey;
      const uploadedFilesToCleanup = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setLoadingTip(`Uploading document ${i + 1} of ${files.length} to AI natively (${(file.size/1024/1024).toFixed(1)}MB)...`);

          const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'X-Goog-Upload-Protocol': 'raw',
              'X-Goog-Upload-Header-Content-Type': file.type || 'application/pdf',
              'Content-Type': file.type || 'application/pdf',
            },
            body: file
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.file) {
             throw new Error(`Upload failed: ${uploadData.error?.message || 'Unknown error'}`);
          }

          const fileName = uploadData.file.name;
          uploadedFilesToCleanup.push(fileName);

          setLoadingTip(`AI is processing document ${i + 1}... This can take a moment for large files.`);
          let state = uploadData.file.state;
          while (state === 'PROCESSING') {
            await new Promise(r => setTimeout(r, 3000));
            const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
            const checkData = await checkRes.json();
            state = checkData.state;
            if (state === 'FAILED') throw new Error("AI failed to process the document.");
          }
        }

        setLoadingTip('Synthesizing study set via Gemini AI...');
        const contents: any[] = [{ parts: [] }];
        
        uploadedFilesToCleanup.forEach(fileName => {
          contents[0].parts.push({ 
            fileData: { 
              mimeType: 'application/pdf', 
              fileUri: `https://generativelanguage.googleapis.com/v1beta/${fileName}`
            } 
          });
        });

        let combinedText = systemPrompt || '';
        if (userText) combinedText += '\n\nCONTEXT:\n' + userText;
        if (combinedText) contents[0].parts.push({ text: combinedText });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
          })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error?.message || "Gemini API Error");
        
        return data.candidates[0].content.parts[0].text;

      } finally {
        for (const fileName of uploadedFilesToCleanup) {
          try {
            await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`, { method: 'DELETE' });
          } catch(e) {
             console.error("Cleanup failed for", fileName);
          }
        }
      }
    } 
    
    const res = await fetch('/api/gemini/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userText }),
    });

    const textResponse = await res.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      throw new Error(`Server returned an invalid response.`);
    }

    if (data.error) {
      if (data.error.toLowerCase().includes('quota')) throw new Error('API_QUOTA_EXCEEDED');
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
    if (voiceText) finalContext += '\n' + voiceText;

    if (inputMode === 'link') {
      const urlInput = document.getElementById('youtube-url-input') as HTMLInputElement;
      if (!urlInput?.value) return alert('Please paste a YouTube URL to begin.');
    } else if (inputMode === 'pdf') {
      if (pdfFiles.length === 0) return alert('Please upload a PDF to begin.');
    } else if (inputMode === 'voice') {
      if (!voiceText.trim()) return alert('Please dictate or type notes to begin.');
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

    const flashcardCount = tier === 'pro' ? 15 : 5;
    const quizCount = tier === 'pro' ? 10 : 3;

    try {
      if (inputMode === 'link') {
        setLoadingTip('Fetching YouTube transcript directly...');
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

      const mainPrompt = `You are an expert tutor. Create highly structured study materials from this content. You MUST generate EXACTLY 5 sections separated by exactly "===SPLIT===" on a new line. Do not bold the SPLIT text.

Section 1: SHORT TITLE (4-8 words max)
===SPLIT===
Section 2: EXECUTIVE SUMMARY (exactly 250 words)
===SPLIT===
Section 3: DETAILED NOTES in Markdown format. Use tables and bold text. Inline math $formula$, block $$formula$$.
===SPLIT===
Section 4: Create exactly ${flashcardCount} FLASHCARDS. Format strictly as a list without bolding Q/A:
Q: [Question text]
A: [Answer text]
===SPLIT===
Section 5: Create exactly ${quizCount} QUIZ QUESTIONS. Format strictly:
Q: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Ans: [A/B/C/D]

Ensure exactly 5 parts using "===SPLIT===" as the separator.`;

      const safeContext = finalContext.substring(0, 150000); 

      const mainResult = await callLLM(mainPrompt, safeContext, pdfFiles);
      
      let parts = mainResult.split(/===SPLIT===/i).map((p: string) => p.trim());
      while (parts.length < 5) {
        parts.push('Content generation incomplete. Please regenerate.');
      }

      // Title parsing
      let generatedTitle = parts[0]?.replace(/^(Title:|Here is.*?|Study Set:?|\*\*.*?:\*\*|Section 1:?)\s*/i, '').replace(/[*#]/g, '').trim().substring(0, 100);
      if (!generatedTitle || generatedTitle.includes('SPLIT')) {
        generatedTitle = `Study Set - ${new Date().toLocaleDateString()}`;
      }

      let summaryClean = (parts[1] || '').trim();
      summaryClean = summaryClean.replace(/^(Here are the comprehensive.*?:?\s*|Here is the summary.*?:?\s*|SUMMARY:?\s*|\*\*SUMMARY\*\*:?\s*)/is, '').trim();
      parts[1] = summaryClean;

      const podPrompt = `Convert this content into a teaching monologue for an audio podcast. 
IMPORTANT RULES: Short sentences, conversational tone, NO stage directions like (excited), NO asterisks or brackets. Just plain text.
Content: ${parts[1] || safeContext.substring(0, 3000)}`;
      
      const podResult = await callLLM(podPrompt, '');
      const cleanPodResult = podResult
        .replace(/\*[^*]*\*/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\b(excitedly|happily|sadly|angrily|cheerfully|dramatically|enthusiastically)\b/gi, '')
        .replace(/\b(pause|beat|sigh|laugh|chuckle|gasp)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setLoadingProgress(100);

      const studySet: StudySet = {
        id: Date.now(),
        title: generatedTitle,
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

      setPdfFiles([]);
      setVoiceText('');

      setIsLoading(false);
      loadStudySet(studySet);
    } catch (e: any) {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setIsLoading(false);
      alert('Error: ' + e.message);
    }
  };

  const loadStudySet = (studySet: StudySet) => {
    setCurrentStudySet(studySet);
    setIsEditing(false); // Reset editing mode naturally
    setChatMessages([
      {
        role: 'ai',
        text: `Hi! I'm Professor Hazel. I've analyzed <b>${studySet.title}</b>. How can I help you study today?`,
      },
    ]);
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
      const prompt = `You are Professor Hazel, a helpful AI tutor. Answer based strictly on the material below:
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
      const prompt = `Translate this entire study set into ${lang}. Maintain ALL the '===SPLIT===' separators exactly as they are. Keep markdown formatting.`;
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

  const togglePodcast = async () => {
    if (!currentStudySet?.podcast) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Securely chunk sentences to avoid OS API cutting them off
    const text = currentStudySet.podcast;
    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
    const lines = chunks.map(c => c.trim()).filter(c => c.length > 0);
    
    setIsPlaying(true);
    window.speechSynthesis.cancel(); // clear previous queues

    const speakLine = (index: number) => {
      if (index >= lines.length || !isPlaying) {
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(lines[index]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      if (selectedVoiceURI) {
        const selectedVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
      }

      utterance.onend = () => speakLine(index + 1);
      utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        if (isPlaying) speakLine(index + 1); // Recover gracefully
        else setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    };

    speakLine(0);
  };

  // Robust manual line-by-line parsing for Flashcards
  const renderFlashcards = (text: string) => {
    if (!text || text.includes('incomplete')) return <p className="text-gray-500">No flashcards generated.</p>;

    const lines = text.split('\n');
    const cards: { question: string; answer: string }[] = [];
    let currentQ = '';
    let currentA = '';
    let state = 'search'; 

    for (let line of lines) {
      line = line.replace(/\*\*/g, '').trim();
      if (!line) continue;
      
      if (/^(?:Q|Question)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        if (currentQ && currentA) cards.push({ question: currentQ.trim(), answer: currentA.trim() });
        currentQ = line.replace(/^(?:Q|Question)(?:\s*\d*)?[:.]\s*/i, '');
        currentA = '';
        state = 'q';
      } else if (/^(?:A|Answer)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        currentA = line.replace(/^(?:A|Answer)(?:\s*\d*)?[:.]\s*/i, '');
        state = 'a';
      } else {
        if (state === 'q') currentQ += '\n' + line;
        else if (state === 'a') currentA += '\n' + line;
      }
    }
    if (currentQ && currentA) cards.push({ question: currentQ.trim(), answer: currentA.trim() });

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
        {cards.length === 0 && <p className="text-gray-500 col-span-full">Format mismatch. Could not parse generated flashcards.</p>}
      </div>
    );
  };

  // Robust manual line-by-line parsing for Quizzes
  const renderQuiz = (text: string) => {
    if (!text || text.includes('incomplete')) return <p className="text-gray-500">No quiz generated.</p>;

    const lines = text.split('\n');
    const questions: { q: string; opts: string[]; answer: string }[] = [];
    let currentQ = { q: '', opts: [] as string[], answer: '' };
    let state = 'search';

    for (let line of lines) {
      line = line.replace(/\*\*/g, '').trim();
      if (!line) continue;
      
      if (/^(?:Q|Question)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        if (currentQ.q && currentQ.opts.length >= 2 && currentQ.answer) questions.push({...currentQ});
        currentQ = { q: line.replace(/^(?:Q|Question)(?:\s*\d*)?[:.]\s*/i, ''), opts: [], answer: '' };
        state = 'q';
      } else if (/^[A-D][).]\s*/i.test(line)) {
        currentQ.opts.push(line.replace(/^[A-D][).]\s*/i, ''));
        state = 'opt';
      } else if (/^(?:Ans|Answer)(?:\s*\d*)?[:.]\s*([A-D])/i.test(line)) {
        const match = line.match(/^(?:Ans|Answer)(?:\s*\d*)?[:.]\s*([A-D])/i);
        if (match) currentQ.answer = match[1].toUpperCase();
        state = 'ans';
      } else {
        if (state === 'q') currentQ.q += '\n' + line;
        else if (state === 'opt' && currentQ.opts.length > 0) currentQ.opts[currentQ.opts.length-1] += '\n' + line;
      }
    }
    if (currentQ.q && currentQ.opts.length >= 2 && currentQ.answer) questions.push({...currentQ});

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
                        const lblIsCorrect = l.getAttribute('data-is-correct') === 'true';
                        if (lblIsCorrect) {
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
        {questions.length === 0 && <p className="text-gray-500 text-center">Format mismatch. Could not parse generated quiz.</p>}
      </div>
    );
  };

  const handleOpenChat = () => { setSidebarCollapsed(true); setChatOpen(true); };
  const handleCloseChat = () => { setChatOpen(false); setSidebarCollapsed(false); };
  
  // Real Rich-Text Editor Commands
  const handleFormat = (command: string, value?: string) => document.execCommand(command, false, value);
  const handleInsertMath = () => { const mathInput = prompt('Enter LaTeX math (e.g., E = mc^2):'); if (mathInput) document.execCommand('insertText', false, ` $${mathInput}$ `); };
  const handleInsertImage = () => { const imageUrl = prompt('Enter image URL:'); if (imageUrl) document.execCommand('insertImage', false, imageUrl); };
  const handleInsertTable = () => {
    const rows = parseInt(prompt('Number of rows:', '3') || '3');
    const cols = parseInt(prompt('Number of columns:', '3') || '3');
    let tableHtml = '<table class="border-collapse border border-gray-400 my-4 w-full"><tbody>';
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
      if (comment) document.execCommand('insertHTML', false, `<span class="bg-yellow-200 text-black px-1 rounded cursor-help" title="${comment}">${selection}</span>`);
    }
  };

  const enterEditMode = () => {
    if (!currentStudySet) return;
    // We convert raw markdown into HTML first so they edit actual formatted nodes
    setEditedSummary(renderMarkdownWithMath(currentStudySet.parts[1] || ''));
    setEditedNotes(renderMarkdownWithMath(currentStudySet.parts[2] || ''));
    setIsEditing(true);
  };

  const saveEditedNotes = async () => {
    if (!currentStudySet) return;
    const updatedParts = [...currentStudySet.parts];
    updatedParts[1] = editedSummary;
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
                <h3 className="text-xl font-bold mb-2 text-white">Upload Handwritten or Typed Notes</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">Upload massive documents straight to Google AI! <span className="text-blue-400 block mt-2">Max Limit: {tier === 'free' ? '10MB' : '100MB'}</span></p>
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
                <p className="text-sm text-gray-400 mb-4">We simply extract the transcript (closed captions) as pure text and send it to our AI. The video file is never downloaded!</p>
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
              <p className="text-sm font-medium text-green-400 bg-green-900/30 px-5 py-2.5 rounded-full border border-green-800 shadow-sm transition-opacity duration-300 text-center max-w-[80%]">
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
                              <><button onClick={saveEditedNotes} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"><Save className="w-3 h-3" /> Save</button><button onClick={() => setIsEditing(false)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-lg font-bold transition hover:bg-gray-600">Cancel</button></>
                            ) : (
                              <button onClick={enterEditMode} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition hover:bg-blue-900/50"><Type className="w-3 h-3" /> Edit Notes</button>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <NoteEditorToolbar onFormat={handleFormat} onInsertMath={handleInsertMath} onInsertImage={handleInsertImage} onInsertTable={handleInsertTable} onAddComment={handleAddComment} />
                        )}
                      </div>
                    )}
                    
                    {isEditing && tier === 'pro' ? (
                      <div className="space-y-6 animate-slide-in">
                        <div className="bg-green-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-green-500/40 relative">
                          <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Summary</div>
                          <div 
                            className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[100px] note-editor-content" 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={(e) => setEditedSummary(e.currentTarget.innerHTML)} 
                            dangerouslySetInnerHTML={{ __html: editedSummary }} 
                          />
                        </div>
                        <div className="bg-blue-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-blue-500/40 relative">
                          <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Notes</div>
                          <div 
                            className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[400px] note-editor-content" 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={(e) => setEditedNotes(e.currentTarget.innerHTML)} 
                            dangerouslySetInnerHTML={{ __html: editedNotes }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="animate-slide-in">
                        <div className="bg-green-900/20 p-6 md:p-8 rounded-[24px] mb-8 border border-green-800/50">
                          <h3 className="text-green-400 font-extrabold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Executive Summary</h3>
                          <div className="text-gray-200 text-lg leading-relaxed prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[1] || 'No summary available.') }} />
                        </div>
                        <div className="prose prose-lg max-w-none text-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[2] || 'No notes available.') }} />
                      </div>
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
                        <label className="text-xs text-indigo-300 mb-2 block">System Voice Selection</label>
                        <select 
                          value={selectedVoiceURI} 
                          onChange={(e) => setSelectedVoiceURI(e.target.value)} 
                          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white w-full max-w-xs focus:outline-none"
                        >
                          {availableVoices.length > 0 ? availableVoices.map(voice => (
                            <option key={voice.voiceURI} value={voice.voiceURI} className="text-black bg-white">{voice.name} ({voice.lang})</option>
                          )) : <option className="text-black bg-white">Loading local voices...</option>}
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
