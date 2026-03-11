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
  ImageIcon,
  FunctionSquare,
  Palette,
  Save,
  RefreshCw,
  FastForward,
  Rewind,
  MessageCircleQuestion,
  Highlighter,
  Table as TableIcon,
  StopCircle,
  ChevronDown,
  Edit2,
  FolderPlus,
  Network,
  Paperclip,
  Check
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { StudySet, UserStats, Folder } from '@/types';
import { safeParseJSON, saveToStorage, renderMarkdownWithMath, getCurrentMonth, pcmToWav, base64ToArrayBuffer } from '@/lib/utils';
import katex from 'katex';

const NoteEditorToolbar = ({ onFormat, onInsertHtml }: any) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [mathInput, setMathInput] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeBgColor, setActiveBgColor] = useState<string | null>(null);
  
  const colors = ['#000000', '#FFFFFF', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#EC4899'];
  const highlights = ['transparent', '#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FED7AA', '#E9D5FF'];
  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Inter'];
  
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    const editor = document.getElementById('active-pro-editor');
    if (editor && document.activeElement !== editor) editor.focus();
    
    if (savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
    }
  };

  const togglePopup = (tool: string) => {
    saveSelection();
    setActivePopup(activePopup === tool ? null : tool);
  };

  const executeFormat = (cmd: string, val?: string) => {
    restoreSelection();
    onFormat(cmd, val);
    setActivePopup(null);
  };

  const handleMathSubmit = () => {
    restoreSelection();
    try {
      const html = katex.renderToString(mathInput, { throwOnError: false });
      onInsertHtml(`&nbsp;<span class="inline-math" contenteditable="false" data-tex="${mathInput}">${html}</span>&nbsp;`);
    } catch {
      onFormat('insertText', ` $${mathInput}$ `);
    }
    setMathInput('');
    setActivePopup(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        restoreSelection();
        onInsertHtml(`<img src="${ev.target?.result}" class="max-w-full h-auto rounded-lg my-4 border border-gray-600 shadow-md" alt="Uploaded Image" />`);
        setActivePopup(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertTable = () => {
    restoreSelection();
    let html = '<table class="w-full border-collapse border border-gray-600 my-4 text-left"><tbody>';
    for(let i = 0; i < tableRows; i++) {
        html += '<tr>';
        for(let j = 0; j < tableCols; j++) {
            html += `<td class="border border-gray-600 p-3 min-w-[50px]"><br></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table><br>';
    onInsertHtml(html);
    setActivePopup(null);
  };

  return (
    <div className="sticky top-20 z-[60] bg-gray-900/95 backdrop-blur-md border border-gray-700 p-2 flex flex-wrap items-center gap-2 shadow-2xl rounded-2xl mb-6 transition-all"
         onMouseDown={(e) => {
             if(e.target === e.currentTarget) e.preventDefault()
         }}>
      
      {/* Font Family */}
      <div className="flex items-center gap-1 border-r border-gray-700 pr-2 relative">
        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('fontFamily'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition text-sm font-bold flex items-center gap-1" title="Font Family">
          Font <ChevronDown className="w-3 h-3" />
        </button>
        {activePopup === 'fontFamily' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-2 shadow-2xl flex flex-col gap-1 z-50 min-w-[140px]">
            {fonts.map(font => (
              <button key={font} className="text-sm text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300 rounded" style={{ fontFamily: font }} onMouseDown={(e) => { e.preventDefault(); executeFormat('fontName', font); }}>{font}</button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-1 border-r border-gray-700 pr-2 relative">
        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('font'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Font Size"><Type className="w-4 h-4" /></button>
        {activePopup === 'font' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-2 shadow-2xl flex flex-col gap-1 z-50 min-w-[120px]">
            <button className="text-sm text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300 rounded" onMouseDown={(e) => { e.preventDefault(); executeFormat('fontSize', '1'); }}>Small</button>
            <button className="text-sm text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300 rounded" onMouseDown={(e) => { e.preventDefault(); executeFormat('fontSize', '3'); }}>Normal</button>
            <button className="text-sm text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300 rounded" onMouseDown={(e) => { e.preventDefault(); executeFormat('fontSize', '5'); }}>Large</button>
            <button className="text-sm text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300 rounded" onMouseDown={(e) => { e.preventDefault(); executeFormat('fontSize', '7'); }}>Huge</button>
          </div>
        )}
      </div>
      
      {/* Formatting & Colors */}
      <div className="flex items-center gap-1 border-r border-gray-700 pr-2 relative">
        <button onMouseDown={(e) => { e.preventDefault(); executeFormat('bold'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Bold"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); executeFormat('italic'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Italic"><Italic className="w-4 h-4" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); executeFormat('underline'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Underline"><Underline className="w-4 h-4" /></button>
        
        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('color'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Text Color"><Palette className="w-4 h-4" /></button>
        {activePopup === 'color' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-3 shadow-2xl flex flex-col gap-3 z-50">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Text Color</p>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(c => (
                <button key={c} onMouseDown={(e) => { e.preventDefault(); setActiveColor(c); executeFormat('foreColor', c); }} className="w-6 h-6 rounded-full border border-gray-600 shadow-sm hover:scale-110 transition flex items-center justify-center" style={{ backgroundColor: c }}>
                  {activeColor === c && <Check className={`w-3 h-3 ${c === '#FFFFFF' ? 'text-black' : 'text-white'}`} />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('highlight'); }} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 transition" title="Highlight Color"><Highlighter className="w-4 h-4" /></button>
        {activePopup === 'highlight' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-3 shadow-2xl flex flex-col gap-3 z-50">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Highlight Color</p>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map(c => (
                <button key={c} onMouseDown={(e) => { e.preventDefault(); setActiveBgColor(c); executeFormat('backColor', c); }} className={`w-6 h-6 rounded-full border border-gray-600 shadow-sm hover:scale-110 transition flex items-center justify-center`} style={{ backgroundColor: c === 'transparent' ? '#374151' : c }} title={c === 'transparent' ? 'Clear Highlight' : c}>
                  {activeBgColor === c && <Check className="w-3 h-3 text-black" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Inserts */}
      <div className="flex items-center gap-1 relative">
        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('math'); }} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><FunctionSquare className="w-4 h-4 text-blue-400" /> Math</button>
        {activePopup === 'math' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-2xl flex flex-col gap-3 z-50 min-w-[280px]">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Enter LaTeX Equation</label>
            <input autoFocus value={mathInput} onChange={e=>setMathInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') { e.preventDefault(); handleMathSubmit(); } }} className="bg-gray-700 text-white px-3 py-2 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500" placeholder="e.g. E = mc^2" />
            <button onMouseDown={(e) => { e.preventDefault(); handleMathSubmit(); }} className="bg-blue-500 text-white text-sm py-2 rounded-lg font-bold">Insert Equation</button>
          </div>
        )}

        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('table'); }} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><TableIcon className="w-4 h-4 text-indigo-400" /> Table</button>
        {activePopup === 'table' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-2xl flex flex-col gap-3 z-50 min-w-[220px]">
             <div className="flex justify-between gap-4">
               <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Rows</label>
                  <input type="number" min="1" max="10" value={tableRows} onChange={e=>setTableRows(Number(e.target.value))} className="w-full bg-gray-700 text-white px-3 py-2 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Cols</label>
                  <input type="number" min="1" max="10" value={tableCols} onChange={e=>setTableCols(Number(e.target.value))} className="w-full bg-gray-700 text-white px-3 py-2 text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
               </div>
             </div>
             <button onMouseDown={(e) => { e.preventDefault(); handleInsertTable(); }} className="bg-indigo-500 text-white text-sm py-2 rounded-lg font-bold mt-2">Insert Table</button>
          </div>
        )}

        <button onMouseDown={(e) => { e.preventDefault(); togglePopup('image'); }} className="p-1.5 hover:bg-gray-700 rounded flex items-center gap-1 text-sm text-gray-300 font-medium transition"><ImageIcon className="w-4 h-4 text-green-400" /> Image</button>
        {activePopup === 'image' && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-2xl flex flex-col gap-3 z-50 min-w-[220px]">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Upload Local Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-300 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600" />
          </div>
        )}
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
  
  // Folders State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFilterFolder, setActiveFilterFolder] = useState<string | null>(null);
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [folderModal, setFolderModal] = useState<{isOpen: boolean, type: 'create'|'edit', folderId?: string, name: string, emoji: string}>({ isOpen: false, type: 'create', name: '', emoji: '📁' });

  // Add Context Modal (Pro)
  const [addContextModalOpen, setAddContextModalOpen] = useState(false);
  const [contextInputMode, setContextInputMode] = useState<'pdf' | 'voice' | 'link'>('pdf');
  const [contextPdfFiles, setContextPdfFiles] = useState<File[]>([]);
  const [contextVoiceText, setContextVoiceText] = useState('');
  const [isAddingContextLoading, setIsAddingContextLoading] = useState(false);

  const [tier, setTier] = useState<'free' | 'pro'>('free');
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(-1);
  const [goProModalOpen, setGoProModalOpen] = useState(false);
  
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);

  // Podcast State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio Ask Professor
  const [askModalOpen, setAskModalOpen] = useState(false);
  const isAskModalOpenRef = useRef(false);
  const [isAskRecording, setIsAskRecording] = useState(false);
  const [askResponse, setAskResponse] = useState('');
  const [isProfSpeaking, setIsProfSpeaking] = useState(false);
  const askMediaRecorder = useRef<MediaRecorder | null>(null);
  const askAudioChunks = useRef<Blob[]>([]);
  const profPlaybackRef = useRef<HTMLAudioElement | null>(null);

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
          
          if (p.stats) {
            setStats(p.stats);
            saveToStorage('hz_stats', p.stats);
          }
          if (p.folders) {
            setFolders(p.folders);
            saveToStorage('hz_folders', p.folders);
          }

          if (p.is_pro) syncFromFirebase(u.uid);
        }
      }
    });

    setStudyHistory(safeParseJSON('hz_study_history', []));
    setStats(safeParseJSON('hz_stats', { streak: 0, notes: 0, lastDate: null, monthlySets: {} }));
    setFolders(safeParseJSON('hz_folders', []));
    
    return () => unsubscribe();
  }, []);

  // --- Folder Management ---
  const saveStatsAndFolders = async (newStats: UserStats, newFolders: Folder[]) => {
    setStats(newStats);
    setFolders(newFolders);
    saveToStorage('hz_stats', newStats);
    saveToStorage('hz_folders', newFolders);
    if (user) {
      try {
        await updateDoc(doc(db, 'profiles', user.uid), { stats: newStats, folders: newFolders });
      } catch(e) {}
    }
  };

  const handleSaveFolder = () => {
    if (!folderModal.name.trim()) return alert("Folder name cannot be empty.");
    let newFolders = [...folders];
    if (folderModal.type === 'create') {
        newFolders.push({ id: Date.now().toString(), name: folderModal.name, emoji: folderModal.emoji || '📁' });
    } else if (folderModal.type === 'edit' && folderModal.folderId) {
        newFolders = newFolders.map(f => f.id === folderModal.folderId ? { ...f, name: folderModal.name, emoji: folderModal.emoji } : f);
    }
    saveStatsAndFolders(stats, newFolders);
    setFolderModal({ isOpen: false, type: 'create', name: '', emoji: '📁' });
  };

  const deleteFolder = (id: string) => {
    if(!confirm("Delete this folder? Your study sets inside will remain safe but uncategorized.")) return;
    const newFolders = folders.filter(f => f.id !== id);
    saveStatsAndFolders(stats, newFolders);
    if(activeFilterFolder === id) setActiveFilterFolder(null);
  };

  const openFolderModal = (type: 'create' | 'edit', folder?: Folder) => {
    setFolderDropdownOpen(false);
    if (type === 'create') {
        setFolderModal({ isOpen: true, type, name: '', emoji: '📁' });
    } else if (type === 'edit' && folder) {
        setFolderModal({ isOpen: true, type, folderId: folder.id, name: folder.name, emoji: folder.emoji });
    }
  };

  const assignFolderToSet = (setId: number, folderId: string) => {
    const newHistory = studyHistory.map(s => s.id === setId ? { ...s, folderId: folderId || undefined } : s);
    setStudyHistory(newHistory);
    saveToStorage('hz_study_history', newHistory);
    const updatedSet = newHistory.find(s => s.id === setId);
    if(updatedSet && tier === 'pro') syncToFirebase(updatedSet);
  };
  // -------------------------

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
      setSyncStatus('offline');
    }
  };

  const deleteStudySet = async (e: any, setId: number) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to delete this study set?")) return;
    
    const newHistory = studyHistory.filter(s => s.id !== setId);
    setStudyHistory(newHistory);
    saveToStorage('hz_study_history', newHistory);
    
    if (user && tier === 'pro') {
      try {
        await deleteDoc(doc(db, 'profiles', user.uid, 'study_sets', setId.toString()));
      } catch(err) { console.error('Error deleting from cloud', err); }
    }
  };

  const callLLM = async (systemPrompt: string, userText: string, files?: File[]) => {
    if (files && files.length > 0) {
      const keyRes = await fetch('/api/gemini');
      const keyData = await keyRes.json();
      if (keyData.error || (!keyData.apiKeys && !keyData.apiKey)) throw new Error("Could not retrieve Gemini API keys");

      const apiKeys = keyData.apiKeys || [keyData.apiKey];
      let lastErrorMsg = '';

      // MULTI-KEY FALLBACK LOOP
      for (const apiKey of apiKeys) {
        const uploadedFilesToCleanup: string[] = [];
        try {
          // 1. Upload files
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
              method: 'POST',
              headers: { 'X-Goog-Upload-Protocol': 'raw', 'X-Goog-Upload-Header-Content-Type': file.type || 'application/pdf', 'Content-Type': file.type || 'application/pdf' },
              body: file
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.file) throw new Error(uploadData.error?.message || `Upload failed`);
            uploadedFilesToCleanup.push(uploadData.file.name);
            let state = uploadData.file.state;
            while (state === 'PROCESSING') {
              await new Promise(r => setTimeout(r, 3000));
              const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadData.file.name}?key=${apiKey}`);
              const checkData = await checkRes.json();
              state = checkData.state;
              if (state === 'FAILED') throw new Error("AI failed to process the document.");
            }
          }

          // 2. Generate Content
          const contents: any[] = [{ parts: [] }];
          uploadedFilesToCleanup.forEach(fileName => {
            contents[0].parts.push({ fileData: { mimeType: 'application/pdf', fileUri: `https://generativelanguage.googleapis.com/v1beta/${fileName}` } });
          });
          let combinedText = systemPrompt || '';
          if (userText) combinedText += '\n\nCONTEXT:\n' + userText;
          if (combinedText) contents[0].parts.push({ text: combinedText });

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 8192, temperature: 0.7 } })
          });

          const data = await response.json();
          if (!response.ok || data.error) throw new Error(data.error?.message || "Gemini API Error");

          // Success: Clean up files explicitly for this key before returning
          for (const fileName of uploadedFilesToCleanup) {
            try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`, { method: 'DELETE' }); } catch(e) {}
          }
          return data.candidates[0].content.parts[0].text;

        } catch (e: any) {
          lastErrorMsg = e.message;
          // Clean up files we just uploaded before falling back to the next key
          for (const fileName of uploadedFilesToCleanup) {
            try { await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`, { method: 'DELETE' }); } catch(cleanupErr) {}
          }

          const errorString = lastErrorMsg.toLowerCase();
          if (errorString.includes('quota') || errorString.includes('exceeded') || errorString.includes('429') || errorString.includes('rate limit')) {
            console.warn(`Key quota exceeded, trying next key...`);
            continue; // Try next key
          } else {
            throw e; // Non-quota error, throw immediately
          }
        }
      }
      throw new Error(`All backup API keys exhausted. Last error: ${lastErrorMsg}`);
    } 
    
    // Server-side fallback handles text-only requests
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userText }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  };

  const generateStudySet = async () => {
    if (tier === 'free') {
      const month = getCurrentMonth();
      if ((stats.monthlySets[month] || 0) >= 2) return setGoProModalOpen(true);
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
    const progressInterval = setInterval(() => {
      if (progress < 95) { progress += Math.random() * 3; setLoadingProgress(Math.min(95, progress)); }
    }, 400);
    const tipInterval = setInterval(() => {
      setLoadingTip(loadingTips[Math.floor(Math.random() * loadingTips.length)]);
    }, 3000);

    const flashcardCount = tier === 'pro' ? 15 : 5;
    const quizCount = tier === 'pro' ? 10 : 3;

    try {
      if (inputMode === 'link') {
        const urlInput = document.getElementById('youtube-url-input') as HTMLInputElement;
        const ytRes = await fetch('/api/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.value }) });
        const ytData = await ytRes.json();
        if (ytData.error) throw new Error(ytData.error);
        finalContext += '\n' + ytData.text;
      }

      const mainPrompt = `You are an expert tutor. Create highly structured study materials from this content. You MUST generate EXACTLY 5 sections separated by exactly "===SPLIT===" on a new line. Do not bold the SPLIT text.

Section 1: SHORT TITLE (4-8 words max, DO NOT include labels like "Title:" or "Short Title:")
===SPLIT===
Section 2: EXECUTIVE SUMMARY (100-150 words, DO NOT include labels like "Executive Summary:")
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
Exp: [Brief explanation of why this is correct]

Ensure exactly 5 parts using "===SPLIT===" as the separator.`;

      const mainResult = await callLLM(mainPrompt, finalContext.substring(0, 150000), pdfFiles);
      
      let parts = mainResult.split(/===SPLIT===/i).map((p: string) => p.trim());
      while (parts.length < 5) parts.push('Content generation incomplete.');

      let generatedTitle = parts[0]?.replace(/^(Title:|Here is.*?|Study Set:?|\*\*.*?:\*\*|Section 1:?|Short Title:?)\s*/i, '').replace(/[*#]/g, '').trim().substring(0, 100) || `Study Set - ${new Date().toLocaleDateString()}`;
      let summaryClean = (parts[1] || '').replace(/^(Here are the comprehensive.*?:?\s*|Here is the summary.*?:?\s*|SUMMARY:?\s*|\*\*SUMMARY\*\*:?\s*|Executive Summary:?)\s*/is, '').trim();
      parts[1] = summaryClean;

      // Lower max words significantly to speed up TTS generation
      const maxWords = tier === 'pro' ? 800 : 300;
      const podPrompt = `Convert this content into a teaching monologue for an audio podcast. Short sentences, conversational tone, plain text only. Limit the script strictly to approximately ${maxWords} words to fit a ${tier === 'pro' ? '5' : '2'}-minute audio format. Content: ${parts[1] || finalContext.substring(0, 3000)}`;
      const podResult = await callLLM(podPrompt, '');
      const cleanPodResult = podResult.replace(/\*[^*]*\*/g, '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();

      clearInterval(progressInterval);
      clearInterval(tipInterval);
      setLoadingProgress(100);

      const studySet: StudySet = {
        id: Date.now(), title: generatedTitle, date: new Date().toISOString(), summary: parts[1].substring(0, 200) + '...',
        flashcardCount, quizCount, parts, podcast: cleanPodResult, chatCount: 0,
      };

      const newHistory = [studySet, ...studyHistory].slice(0, 50);
      setStudyHistory(newHistory);
      saveToStorage('hz_study_history', newHistory);
      if (tier === 'pro') await syncToFirebase(studySet);

      const today = new Date().toDateString();
      const newStats = { ...stats };
      if (newStats.lastDate !== today) { newStats.streak += 1; newStats.lastDate = today; }
      newStats.notes += 1;
      const month = getCurrentMonth();
      newStats.monthlySets[month] = (newStats.monthlySets[month] || 0) + 1;
      
      saveStatsAndFolders(newStats, folders);

      setPdfFiles([]); setVoiceText(''); setIsLoading(false);
      loadStudySet(studySet);
    } catch (e: any) {
      clearInterval(progressInterval); clearInterval(tipInterval); setIsLoading(false);
      alert('Error: ' + e.message);
    }
  };

  // --- Add Context (Pro) ---
  const handleAddContext = async () => {
     if (tier !== 'pro') return setGoProModalOpen(true);
     if (!currentStudySet) return;

     let finalContext = '';
     if (contextVoiceText) finalContext += '\n' + contextVoiceText;

     if (contextInputMode === 'link') {
        const urlInput = document.getElementById('context-url-input') as HTMLInputElement;
        if (!urlInput?.value) return alert('Please paste a YouTube URL to begin.');
        setIsAddingContextLoading(true);
        try {
           const ytRes = await fetch('/api/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlInput.value }) });
           const ytData = await ytRes.json();
           if (ytData.error) throw new Error(ytData.error);
           finalContext += '\n' + ytData.text;
        } catch(e: any) {
           setIsAddingContextLoading(false);
           return alert('Error fetching YouTube: ' + e.message);
        }
     } else if (contextInputMode === 'pdf') {
        if (contextPdfFiles.length === 0) return alert('Please upload a PDF to begin.');
     } else if (contextInputMode === 'voice') {
        if (!contextVoiceText.trim()) return alert('Please dictate or type notes to begin.');
     }

     setIsAddingContextLoading(true);

     try {
         const prompt = `You are an expert tutor. I am providing existing study notes and new source material.
         Integrate the relevant information from the new source material into the existing notes seamlessly, adding new sections or expanding existing ones where appropriate.
         Return ONLY the output in this EXACT format:
         TITLE: [New Updated Title reflecting the combined notes (4-8 words max)]
         ===SPLIT===
         [Updated Comprehensive Notes in Markdown format]
         `;

         const result = await callLLM(prompt, finalContext, contextInputMode === 'pdf' ? contextPdfFiles : undefined);
         
         const parts = result.split('===SPLIT===');
         let newTitle = currentStudySet.title;
         let cleanNotes = result;
         
         if (parts.length > 1) {
             newTitle = parts[0].replace(/TITLE:/i, '').replace(/\*/g, '').trim();
             cleanNotes = parts[1].replace(/^```[a-z]*\n/im, '').replace(/\n```$/m, '').trim();
         } else {
             cleanNotes = parts[0].replace(/^```[a-z]*\n/im, '').replace(/\n```$/m, '').trim();
         }

         const newParts = [...currentStudySet.parts];
         newParts[2] = cleanNotes;
         
         const updatedSet = { ...currentStudySet, title: newTitle, parts: newParts };
         setCurrentStudySet(updatedSet);
         
         const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
         setStudyHistory(newHistory);
         saveToStorage('hz_study_history', newHistory);
         if (tier === 'pro') syncToFirebase(updatedSet);

         // Reset Context State
         setContextPdfFiles([]);
         setContextVoiceText('');
         setAddContextModalOpen(false);
         setIsAddingContextLoading(false);
         alert("Context seamlessly integrated and title updated!");
     } catch (e: any) {
         setIsAddingContextLoading(false);
         alert("Error adding context: " + e.message);
     }
  };
  // -------------------------

  const loadStudySet = (studySet: StudySet) => {
    setCurrentStudySet(studySet);
    setIsEditing(false);
    setAudioUrl(null);
    setChatMessages([{ role: 'ai', text: `Hi! I've analyzed <b>${studySet.title}</b>. How can I help?` }]);
    setCurrentView('study');
    setCurrentTab('notes');
  };

  const translateNotes = async () => {
    if (!currentStudySet) return;
    const langSelect = document.getElementById('translate-language') as HTMLSelectElement;
    const lang = langSelect?.value || 'Urdu';
    
    setTranslateProgress(0);
    const interval = setInterval(() => {
      setTranslateProgress(p => p < 90 ? p + (Math.random() * 5) : p);
    }, 800);

    try {
      const content = currentStudySet.parts.join('\n===SPLIT===\n');
      const podcastText = currentStudySet.podcast;
      const prompt = `Translate this ENTIRE study set into ${lang}. This includes the Title, Summary, Detailed Notes, Flashcards, and Quizzes. Maintain ALL the '===SPLIT===' separators exactly as they are. Keep markdown formatting intact.\n\nAlso translate the Podcast text provided at the very end.\n\nCONTENT:\n${content}\n\n===PODCAST_START===\n${podcastText}`;
      
      const result = await callLLM(prompt, '');
      const [mainBody, newPodcastText] = result.split('===PODCAST_START===');
      const newParts = mainBody.split('===SPLIT===').map((p: string) => p.trim());

      const newSet: StudySet = {
        ...currentStudySet,
        id: Date.now(),
        title: `${currentStudySet.title} (${lang})`,
        parts: newParts.length >= 5 ? newParts : currentStudySet.parts, 
        podcast: newPodcastText ? newPodcastText.trim() : currentStudySet.podcast,
        date: new Date().toISOString(),
      };

      setTranslateProgress(100);
      clearInterval(interval);
      
      setTimeout(() => {
        const newHistory = [newSet, ...studyHistory].slice(0, 50);
        setStudyHistory(newHistory);
        saveToStorage('hz_study_history', newHistory);
        if (tier === 'pro') syncToFirebase(newSet);
        setTranslateProgress(-1);
        setTranslateModalOpen(false);
        loadStudySet(newSet);
      }, 500);

    } catch (e: any) {
      clearInterval(interval);
      setTranslateProgress(-1);
      alert('Translation failed: ' + e.message);
    }
  };

  const generateMoreFlashcards = async () => {
    if(!currentStudySet) return;
    setIsGeneratingExtra(true);
    try {
        const prompt = `Generate 5 MORE distinct flashcards based on this context that are not currently covered. Format strictly as a list without bolding Q/A:\nQ: [Question text]\nA: [Answer text]\n\nContext:\n${currentStudySet.parts[2].substring(0, 15000)}`;
        const result = await callLLM(prompt, '');
        const updatedParts = [...currentStudySet.parts];
        updatedParts[3] += '\n\n' + result;
        const updatedSet = { ...currentStudySet, parts: updatedParts, flashcardCount: currentStudySet.flashcardCount + 5 };
        setCurrentStudySet(updatedSet);
        const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
        setStudyHistory(newHistory);
        saveToStorage('hz_study_history', newHistory);
        if(tier === 'pro') syncToFirebase(updatedSet);
    } catch(e) {}
    setIsGeneratingExtra(false);
  };

  const generateMoreQuiz = async () => {
    if(!currentStudySet) return;
    setIsGeneratingExtra(true);
    try {
        const prompt = `Generate 5 MORE distinct multiple choice quiz questions based on this context. Format strictly:\nQ: [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nAns: [A/B/C/D]\nExp: [Brief explanation]\n\nContext:\n${currentStudySet.parts[2].substring(0, 15000)}`;
        const result = await callLLM(prompt, '');
        const updatedParts = [...currentStudySet.parts];
        updatedParts[4] += '\n\n' + result;
        const updatedSet = { ...currentStudySet, parts: updatedParts, quizCount: currentStudySet.quizCount + 5 };
        setCurrentStudySet(updatedSet);
        const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
        setStudyHistory(newHistory);
        saveToStorage('hz_study_history', newHistory);
        if(tier === 'pro') syncToFirebase(updatedSet);
    } catch(e) {}
    setIsGeneratingExtra(false);
  };

  const togglePodcast = async () => {
    if (!currentStudySet?.podcast) return;
    if (audioUrl) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
      else { audioRef.current?.play(); setIsPlaying(true); }
      return;
    }

    setIsAudioLoading(true);
    setPodcastProgress(0);
    const progressInterval = setInterval(() => setPodcastProgress(p => p < 95 ? p + 2 : p), 600);

    try {
      const keyRes = await fetch('/api/gemini');
      const keyData = await keyRes.json();
      const apiKeys = keyData.apiKeys || [keyData.apiKey];

      const payload = {
          contents: [{ parts: [{ text: currentStudySet.podcast }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } }
      };

      let successData = null;
      let lastErrorMsg = '';

      for (const apiKey of apiKeys) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
              method: 'POST', body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error?.message || "Failed to generate audio");
          successData = data;
          break; 
        } catch(e: any) {
          lastErrorMsg = e.message;
          const errorString = lastErrorMsg.toLowerCase();
          if (errorString.includes('quota') || errorString.includes('exceeded') || errorString.includes('429')) {
             console.warn("TTS Quota exceeded. Retrying with next backup key...");
             continue; 
          } else {
             throw e; 
          }
        }
      }

      if (!successData) throw new Error(`Audio generation failed across all backup keys. Last error: ${lastErrorMsg}`);

      const base64 = successData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if(!base64) throw new Error("No audio payload returned");
      
      const wavBlob = pcmToWav(base64ToArrayBuffer(base64), 24000);
      const urlBlob = URL.createObjectURL(wavBlob);
      
      clearInterval(progressInterval);
      setPodcastProgress(100);
      
      setAudioUrl(urlBlob);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 200);
    } catch (e: any) {
      clearInterval(progressInterval);
      alert("Audio Error: " + e.message);
    }
    setTimeout(() => setIsAudioLoading(false), 500);
  };

  const toggleAskRecording = async () => {
    if (isAskRecording) {
        askMediaRecorder.current?.stop();
        setIsAskRecording(false);
    } else {
        setAskResponse('');
        stopProfSpeaking();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            askMediaRecorder.current = new MediaRecorder(stream);
            askAudioChunks.current = [];
            askMediaRecorder.current.ondataavailable = e => askAudioChunks.current.push(e.data);
            askMediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(askAudioChunks.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64data = (reader.result as string).split(',')[1];
                    await processVoiceQuestion(base64data, 'audio/webm');
                };
            };
            askMediaRecorder.current.start();
            setIsAskRecording(true);
        } catch(e) { 
            alert('Microphone access denied or not supported.'); 
        }
    }
  };

  const processVoiceQuestion = async (base64: string, mimeType: string) => {
    setAskResponse('<span class="animate-pulse">Analyzing audio and thinking...</span>');
    try {
        const prompt = `You are Professor Hazel. The student is asking a verbal question. Use the notes context to answer concisely and naturally as if speaking.\n\nContext:\n${currentStudySet?.parts[2]}`;
        const res = await fetch('/api/gemini', {
            method: 'POST', body: JSON.stringify({ systemPrompt: prompt, userText: '', audioBase64: base64, audioMimeType: mimeType })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        const textResponse = data.result;
        setAskResponse(`<b>Professor Hazel:</b> ${textResponse}`);
        
        const keyRes = await fetch('/api/gemini');
        const keyData = await keyRes.json();
        const apiKeys = keyData.apiKeys || [keyData.apiKey];
        
        const payload = { contents: [{ parts: [{ text: textResponse }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } } };
        
        let ttsData = null;
        let lastErrorMsg = '';

        for (const apiKey of apiKeys) {
           try {
              const ttsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, { method: 'POST', body: JSON.stringify(payload) });
              const data = await ttsRes.json();
              if(!ttsRes.ok || data.error) throw new Error(data.error?.message || "TTS error");
              ttsData = data;
              break;
           } catch(e: any) {
              lastErrorMsg = e.message;
              if (lastErrorMsg.toLowerCase().includes('quota') || lastErrorMsg.toLowerCase().includes('exceeded') || lastErrorMsg.includes('429')) continue;
              throw e;
           }
        }
        
        if (!ttsData) throw new Error(`TTS failed across all keys: ${lastErrorMsg}`);

        const audioBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (audioBase64) {
            const wavBlob = pcmToWav(base64ToArrayBuffer(audioBase64), 24000);
            const urlBlob = URL.createObjectURL(wavBlob);
            
            // Immediately abort playing if the modal was closed while generating
            if (!isAskModalOpenRef.current) return;

            if (!profPlaybackRef.current) {
                profPlaybackRef.current = new Audio();
                profPlaybackRef.current.onended = () => setIsProfSpeaking(false);
            }
            profPlaybackRef.current.src = urlBlob;
            profPlaybackRef.current.play();
            setIsProfSpeaking(true);
        }
    } catch(e: any) {
        setAskResponse(`<span class="text-red-400">Error: ${e.message}</span>`);
    }
  };

  const stopProfSpeaking = () => {
    if (profPlaybackRef.current) {
        profPlaybackRef.current.pause();
        profPlaybackRef.current.currentTime = 0;
        setIsProfSpeaking(false);
    }
  };

  const handleAskProfessor = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    isAskModalOpenRef.current = true;
    setAskModalOpen(true);
    setAskResponse('');
    stopProfSpeaking();
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatFile) return;
    if (!currentStudySet) return;
    if (tier === 'free' && currentStudySet.chatCount >= 3) return setGoProModalOpen(true);

    const text = chatInput;
    const fileToSend = chatFile;
    
    setChatInput('');
    setChatFile(null);

    setChatMessages(prev => [...prev, { 
       role: 'user', 
       text: text + (fileToSend ? `<div class="text-xs text-green-300 mt-1 font-medium bg-green-900/30 p-1.5 rounded inline-block">📎 ${fileToSend.name}</div>` : '') 
    }]);

    if (tier === 'free') {
      const updatedSet = { ...currentStudySet, chatCount: (currentStudySet.chatCount || 0) + 1 };
      setCurrentStudySet(updatedSet);
      const newHistory = studyHistory.map(s => s.id === updatedSet.id ? updatedSet : s);
      setStudyHistory(newHistory);
      saveToStorage('hz_study_history', newHistory);
    }

    setChatMessages(prev => [...prev, { role: 'ai', text: '<span class="animate-pulse">Thinking...</span>' }]);
    try {
      const prompt = `You are Professor Hazel, a helpful AI tutor. Answer based strictly on the material below:\n${currentStudySet.parts.join('\n')}`;
      const response = await callLLM(prompt, text, fileToSend ? [fileToSend] : undefined);
      setChatMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'ai', text: renderMarkdownWithMath(response) }; return n; });
    } catch (e: any) {
      setChatMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'ai', text: `<span class="text-red-500">Error: ${e.message}</span>` }; return n; });
    }
  };

  const FlashcardsViewer = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    const cards: { question: string; answer: string }[] = [];
    let currentQ = '', currentA = '', state = 'search'; 
    for (let line of lines) {
      line = line.replace(/\*\*/g, '').trim();
      if (!line) continue;
      if (/^(?:Q|Question)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        if (currentQ && currentA) cards.push({ question: currentQ.trim(), answer: currentA.trim() });
        currentQ = line.replace(/^(?:Q|Question)(?:\s*\d*)?[:.]\s*/i, ''); currentA = ''; state = 'q';
      } else if (/^(?:A|Answer)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        currentA = line.replace(/^(?:A|Answer)(?:\s*\d*)?[:.]\s*/i, ''); state = 'a';
      } else {
        if (state === 'q') currentQ += '\n' + line; else if (state === 'a') currentA += '\n' + line;
      }
    }
    if (currentQ && currentA) cards.push({ question: currentQ.trim(), answer: currentA.trim() });

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div key={i} className="flip-card" onClick={(e) => e.currentTarget.classList.toggle('flipped')}>
              <div className="flip-card-inner">
                <div className="flip-card-front bg-gray-800/50 backdrop-blur-lg border border-gray-700" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(card.question) }} />
                <div className="flip-card-back" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(card.answer) }} />
              </div>
            </div>
          ))}
          {cards.length === 0 && <p className="text-gray-500 col-span-full">No flashcards parsed.</p>}
        </div>
        {tier === 'pro' && (
          <div className="text-center pt-8 border-t border-gray-700">
             <button onClick={generateMoreFlashcards} disabled={isGeneratingExtra} className="btn-primary px-8 py-3 bg-blue-600 hover:bg-blue-700 font-bold disabled:opacity-50">
               {isGeneratingExtra ? 'Generating...' : 'Generate 5 More Flashcards (Pro)'}
             </button>
          </div>
        )}
      </div>
    );
  };

  const QuizViewer = ({ text }: { text: string }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    
    const lines = text.split('\n');
    const questions: { q: string; opts: string[]; answer: string; explanation: string }[] = [];
    let currentQ = { q: '', opts: [] as string[], answer: '', explanation: '' };
    let state = 'search';

    for (let line of lines) {
      line = line.replace(/\*\*/g, '').trim();
      if (!line) continue;
      if (/^(?:Q|Question)(?:\s*\d*)?[:.]\s*(.*)/i.test(line)) {
        if (currentQ.q && currentQ.opts.length >= 2 && currentQ.answer) questions.push({...currentQ});
        currentQ = { q: line.replace(/^(?:Q|Question)(?:\s*\d*)?[:.]\s*/i, ''), opts: [], answer: '', explanation: '' }; state = 'q';
      } else if (/^[A-D][).]\s*/i.test(line)) {
        currentQ.opts.push(line.replace(/^[A-D][).]\s*/i, '')); state = 'opt';
      } else if (/^(?:Ans|Answer)(?:\s*\d*)?[:.]\s*([A-D])/i.test(line)) {
        const match = line.match(/^(?:Ans|Answer)(?:\s*\d*)?[:.]\s*([A-D])/i);
        if (match) currentQ.answer = match[1].toUpperCase(); state = 'ans';
      } else if (/^(?:Exp|Explanation)[:.]\s*(.*)/i.test(line)) {
        currentQ.explanation = line.replace(/^(?:Exp|Explanation)[:.]\s*/i, ''); state = 'exp';
      } else {
        if (state === 'q') currentQ.q += '\n' + line;
        else if (state === 'opt' && currentQ.opts.length > 0) currentQ.opts[currentQ.opts.length-1] += '\n' + line;
        else if (state === 'exp') currentQ.explanation += '\n' + line;
      }
    }
    if (currentQ.q && currentQ.opts.length >= 2 && currentQ.answer) questions.push({...currentQ});

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        {questions.map((q, i) => (
          <div key={i} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 p-6 rounded-2xl">
            <h4 className="font-bold text-gray-100 mb-4">{i + 1}. {q.q}</h4>
            <div className="space-y-2">
              {q.opts.map((opt, j) => {
                const letter = String.fromCharCode(65 + j);
                const isSelected = userAnswers[i] === letter;
                const isCorrect = letter === q.answer;
                const hasAnswered = !!userAnswers[i];
                
                let btnClass = "border-gray-600 hover:bg-gray-700/50";
                if (hasAnswered) {
                  if (isCorrect) btnClass = "bg-green-900/30 border-green-500";
                  else if (isSelected) btnClass = "bg-red-900/30 border-red-500";
                  else btnClass = "border-gray-600 opacity-50";
                }

                return (
                  <label key={j} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${btnClass}`} style={{ pointerEvents: hasAnswered ? 'none' : 'auto' }}>
                    <input type="radio" name={`quiz_q_${i}`} value={letter} checked={isSelected} onChange={() => setUserAnswers(prev => ({...prev, [i]: letter}))} className="accent-green-500" />
                    <span className="text-gray-200"><b>{letter}.</b> {opt}</span>
                  </label>
                );
              })}
            </div>
            {userAnswers[i] && (
              <div className={`mt-4 p-4 rounded-xl border ${userAnswers[i] === q.answer ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-red-900/20 border-red-800 text-red-300'}`}>
                <p className="font-bold mb-1">{userAnswers[i] === q.answer ? 'Correct!' : `Incorrect. Correct answer: ${q.answer}`}</p>
                <p className="text-sm">{q.explanation || 'No explanation provided.'}</p>
              </div>
            )}
          </div>
        ))}
        {questions.length === 0 && <p className="text-gray-500 text-center">No quiz generated.</p>}
        {tier === 'pro' && (
          <div className="text-center pt-8 border-t border-gray-700 mt-8">
             <button onClick={generateMoreQuiz} disabled={isGeneratingExtra} className="btn-primary px-8 py-3 bg-purple-600 hover:bg-purple-700 font-bold disabled:opacity-50">
               {isGeneratingExtra ? 'Generating...' : 'Generate 5 More Questions (Pro)'}
             </button>
          </div>
        )}
      </div>
    );
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
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-800 rounded-lg transition"><X className="w-5 h-5" /></button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace</div>
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
        {tier === 'free' ? (
          <div className="mb-2"><button onClick={() => setGoProModalOpen(true)} className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">⚡ Upgrade to Pro</button></div>
        ) : (
          <div className="mb-2 px-3 py-2 bg-green-900/30 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-green-400"><Save className="w-3 h-3" /><span>Pro Plan Active</span></div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1"><RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} /><span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</span></div>
          </div>
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

      <main className={`flex-1 h-full overflow-y-auto relative transition-all duration-300 ${sidebarCollapsed ? 'md:ml-0' : ''}`}>
        <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2">
          <Menu className="w-5 h-5" /> <span className="text-sm font-medium">Menu</span>
        </button>

        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2"><img src="/hazelnote_logo.png" className="w-8 h-8 rounded-lg" /><span className="font-extrabold text-lg text-white">HazelNote</span></div>
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
                <div><p className="text-sm text-gray-400 font-medium">Study Streak</p><p className="text-3xl font-extrabold text-white">{stats.streak} <span className="text-lg text-gray-500 font-medium">Days</span></p></div>
              </div>
              <div className="glass-card p-6 flex items-center gap-5 transition hover:shadow-lg bg-gray-800/50 backdrop-blur-lg border-gray-700">
                <div className="w-14 h-14 rounded-2xl bg-blue-900/40 flex items-center justify-center text-blue-400"><FileCheck2 className="w-7 h-7" /></div>
                <div><p className="text-sm text-gray-400 font-medium">Notes Generated</p><p className="text-3xl font-extrabold text-white">{stats.notes}</p></div>
              </div>
              {tier === 'free' && (
                <div className="glass-card p-6 flex items-center gap-5 transition hover:shadow-lg bg-gray-800/50 backdrop-blur-lg border-gray-700">
                  <div className="w-14 h-14 rounded-2xl bg-purple-900/40 flex items-center justify-center text-purple-400"><Sparkles className="w-7 h-7" /></div>
                  <div><p className="text-sm text-gray-400 font-medium">Monthly Sets</p><p className="text-3xl font-extrabold text-white">{stats.monthlySets?.[getCurrentMonth()] || 0}<span className="text-lg text-gray-500 font-medium">/2</span></p></div>
                </div>
              )}
            </div>

            <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden bg-gray-800/50 backdrop-blur-lg border-gray-700 mb-10">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400"><Sparkles className="w-10 h-10" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to learn something new?</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload PDFs, dictate voice notes, or paste YouTube URLs to generate your next study set.</p>
              <button onClick={() => setCurrentView('create')} className="btn-primary px-10 py-4 text-lg shadow-xl">Create New Study Set</button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="relative inline-block text-left z-20">
                <button 
                   onClick={() => setFolderDropdownOpen(!folderDropdownOpen)} 
                   className="px-5 py-2.5 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2 border border-gray-700 shadow-md transition-all"
                >
                  {activeFilterFolder 
                    ? <>{folders.find(f => f.id === activeFilterFolder)?.emoji} {folders.find(f => f.id === activeFilterFolder)?.name}</> 
                    : <>📁 All Sets</>
                  }
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                </button>

                {folderDropdownOpen && (
                   <div className="absolute left-0 mt-2 w-64 rounded-xl shadow-2xl bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 border border-gray-700 overflow-hidden">
                     <div className="max-h-[300px] overflow-y-auto py-1">
                       <button 
                         className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-gray-700 transition" 
                         onClick={() => { setActiveFilterFolder(null); setFolderDropdownOpen(false); }}
                       >
                         📁 All Sets
                       </button>
                       {folders.map(f => (
                          <div key={f.id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-700 group transition">
                             <button 
                               className="flex-1 text-left text-sm font-bold text-gray-300 group-hover:text-white transition" 
                               onClick={() => { setActiveFilterFolder(f.id); setFolderDropdownOpen(false); }}
                             >
                               {f.emoji} {f.name}
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); openFolderModal('edit', f); }} 
                                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-600 rounded-md transition"
                             >
                               <Edit2 className="w-3.5 h-3.5"/>
                             </button>
                          </div>
                       ))}
                       <div className="border-t border-gray-700 my-1"></div>
                       <button 
                         className="w-full px-4 py-3 text-sm font-bold text-green-400 hover:bg-gray-700 flex items-center gap-2 transition" 
                         onClick={() => openFolderModal('create')}
                       >
                         <FolderPlus className="w-4 h-4" /> Create New Folder
                       </button>
                     </div>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Study Sets</h3>
              {studyHistory.filter(s => activeFilterFolder ? s.folderId === activeFilterFolder : true).length === 0 ? (
                 <p className="text-gray-500 text-center py-8 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">No study sets found in this view.</p>
              ) : (
                studyHistory
                  .filter(s => activeFilterFolder ? s.folderId === activeFilterFolder : true)
                  .slice(0, 10)
                  .map(set => (
                  <div key={set.id} onClick={() => loadStudySet(set)} className="glass-card p-5 hover:shadow-lg transition cursor-pointer bg-gray-800/50 backdrop-blur-lg border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white flex-1 mr-2">{set.title}</h4>
                      <div className="flex items-center gap-3">
                         <select 
                            value={set.folderId || ''} 
                            onClick={(e) => e.stopPropagation()} 
                            onChange={(e) => assignFolderToSet(set.id, e.target.value)}
                            className="bg-gray-900 text-xs text-gray-400 font-bold rounded-lg px-2 py-1.5 border border-gray-700 outline-none hover:bg-gray-700 transition"
                            title="Move to folder"
                         >
                            <option value="">No Folder</option>
                            {folders.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
                         </select>
                         <button onClick={(e) => deleteStudySet(e, set.id)} className="text-gray-500 hover:text-red-400 transition p-1.5 bg-gray-900 hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">Upload documents to AI natively! <span className="text-blue-400 block mt-2">Max Limit: {tier === 'free' ? '10MB' : '100MB'}</span></p>
                <input type="file" id="pdf-upload" multiple accept=".pdf" className="hidden" onChange={(e)=>{
                   const files = Array.from(e.target.files || []);
                   const maxMB = tier === 'free' ? 10 : 100; 
                   const currentSize = pdfFiles.reduce((a, b) => a + b.size, 0) + files.reduce((a, b) => a + b.size, 0);
                   if (currentSize > maxMB * 1024 * 1024) return alert(`Limit exceeded: ${maxMB}MB max.`);
                   setPdfFiles(prev => [...prev, ...files]);
                }} />
                <label htmlFor="pdf-upload" className="btn-primary px-10 py-4 cursor-pointer inline-block shadow-lg text-lg">Browse Files</label>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  {pdfFiles.map((file, i) => (
                    <span key={i} className="bg-green-900/40 text-green-400 text-xs px-4 py-2 rounded-full font-bold border border-green-800 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" /> {file.name}
                      <button onClick={() => setPdfFiles(pdfFiles.filter((_, idx)=>idx!==i))} className="hover:text-red-400 transition ml-1 bg-green-800/50 hover:bg-red-900/50 p-1 rounded-full"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {inputMode === 'voice' && (
              <div className="glass-card p-8 md:p-12 text-center bg-gray-800/50 backdrop-blur-lg"><textarea value={voiceText} onChange={e=>setVoiceText(e.target.value)} className="w-full h-40 p-5 border border-gray-600 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-700 text-white" placeholder="Type or dictate your notes..." /></div>
            )}
            {inputMode === 'link' && (
              <div className="glass-card p-8 md:p-10 bg-gray-800/50 backdrop-blur-lg">
                <input type="text" id="youtube-url-input" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} className="w-full border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 bg-gray-700 text-white" placeholder="Paste a YouTube URL here..." />
              </div>
            )}

            <div className="mt-10 text-center">
              <button onClick={generateStudySet} className="btn-primary px-10 md:px-16 py-4 md:py-5 text-lg md:text-xl shadow-xl w-full md:w-auto flex items-center justify-center gap-3 mx-auto"><Wand2 className="w-5 h-5" /> Generate Study Set</button>
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
              <div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-3xl font-extrabold text-white tracking-tighter">{Math.round(loadingProgress)}%</span></div>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">Synthesizing Knowledge...</h3>
            <p className="text-sm font-medium text-green-400 bg-green-900/30 px-5 py-2.5 rounded-full border border-green-800 inline-block shadow-sm transition-opacity">{loadingTip}</p>
          </div>
        )}

        {currentView === 'study' && currentStudySet && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 pt-6 md:pt-10 relative">
            <div className="mb-6 flex justify-between items-center">
              <button onClick={() => setCurrentView('dashboard')} className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back</button>
            </div>
            
            <div className="glass-card bg-gray-800/50 backdrop-blur-lg border-gray-700 relative overflow-visible">
              <div className="border-b border-gray-700 bg-gray-800/50 p-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-t-[24px]">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{currentStudySet.title}</h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button onClick={() => window.print()} className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-gray-600"><Printer className="w-4 h-4" /> Export PDF</button>
                  <button onClick={() => setTranslateModalOpen(true)} className="text-sm bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border border-blue-800"><Languages className="w-4 h-4" /> Translate</button>
                  <button onClick={() => { setSidebarCollapsed(true); setChatOpen(true); }} className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md border border-green-600"><img src="/hazelnote_tutor.png" className="w-5 h-5 rounded-full object-cover aspect-square bg-white border border-green-400" /> Chat with Professor Hazel</button>
                </div>
              </div>

              <div className="px-6 md:px-8 pt-8 pb-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] z-10 relative">
                <div className="inline-flex p-1.5 bg-gray-800 border border-gray-700 rounded-[20px] shadow-sm gap-1 overflow-x-auto max-w-full">
                  {(['notes', 'flashcards', 'quiz', 'podcast'] as const).map((tab) => (
                    <button key={tab} onClick={() => setCurrentTab(tab)} className={`text-sm px-5 py-2.5 rounded-xl font-bold transition-all ${currentTab === tab ? 'bg-green-500 text-white shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 min-h-[600px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] study-content-area rounded-b-[24px]">
                {currentTab === 'notes' && (
                  <div>
                    {tier === 'pro' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> Pro Editing Enabled</span>
                          <div className="flex gap-2">
                            <button onClick={() => setAddContextModalOpen(true)} className="text-xs bg-indigo-900/40 border border-indigo-700 text-indigo-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-800/60 transition shadow-sm">
                              <Network className="w-3 h-3"/> Add Context (Pro)
                            </button>
                            {isEditing ? (
                              <>
                                <button onClick={async () => {
                                  const up = [...currentStudySet.parts]; up[1] = editedSummary; up[2] = editedNotes;
                                  const set = { ...currentStudySet, parts: up };
                                  setCurrentStudySet(set); setStudyHistory(studyHistory.map(s => s.id === set.id ? set : s));
                                  if (tier === 'pro') await syncToFirebase(set); setIsEditing(false);
                                }} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm"><Save className="w-3 h-3 inline mr-1" />Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg font-bold">Cancel</button>
                              </>
                            ) : (
                              <button onClick={() => { setEditedSummary(renderMarkdownWithMath(currentStudySet.parts[1])); setEditedNotes(renderMarkdownWithMath(currentStudySet.parts[2])); setIsEditing(true); }} className="text-xs bg-blue-900/40 border border-blue-800 text-blue-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition shadow-sm"><Type className="w-3 h-3" /> Edit Notes</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isEditing && tier === 'pro' && (
                      <NoteEditorToolbar 
                         onFormat={(cmd: string, val: string) => document.execCommand(cmd, false, val)} 
                         onInsertHtml={(html: string) => document.execCommand('insertHTML', false, html)}
                      />
                    )}

                    {isEditing && tier === 'pro' ? (
                      <div className="space-y-6">
                        <div className="bg-green-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-green-500/40 relative"><div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Summary</div><div className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[100px] note-editor-content" contentEditable suppressContentEditableWarning onBlur={(e) => setEditedSummary(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: editedSummary }} /></div>
                        <div className="bg-blue-900/10 p-6 md:p-8 rounded-[24px] border-2 border-dashed border-blue-500/40 relative">
                          <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[24px] uppercase tracking-wider">Editing Notes</div>
                          <div id="active-pro-editor" className="prose prose-lg max-w-none text-gray-200 focus:outline-none min-h-[400px] note-editor-content" contentEditable suppressContentEditableWarning onBlur={(e) => setEditedNotes(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: editedNotes }} />
                        </div>
                      </div>
                    ) : (
                      <div className="animate-slide-in">
                        <div className="bg-green-900/20 p-6 md:p-8 rounded-[24px] mb-8 border border-green-800/50"><h3 className="text-green-400 font-extrabold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Executive Summary</h3><div className="text-gray-200 text-lg leading-relaxed prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[1]) }} /></div>
                        <div className="prose prose-lg max-w-none text-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(currentStudySet.parts[2]) }} />
                      </div>
                    )}
                  </div>
                )}
                
                {currentTab === 'flashcards' && <FlashcardsViewer text={currentStudySet.parts[3]} />}
                {currentTab === 'quiz' && <QuizViewer text={currentStudySet.parts[4]} />}
                
                {currentTab === 'podcast' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 md:p-12 text-white text-center shadow-xl border border-indigo-500/30">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        {isAudioLoading ? <RefreshCw className="w-10 h-10 text-white animate-spin" /> : <Headphones className="w-10 h-10 text-white" />}
                        {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>}
                      </div>
                      <h3 className="text-3xl font-extrabold mb-2">Audio Lesson</h3>
                      <p className="text-indigo-200 mb-6 max-w-md mx-auto text-sm">Listen to a custom AI-generated teaching monologue based on your notes. ({tier === 'pro' ? 'Max 5 Mins' : 'Max 2 Mins'})</p>
                      
                      {isAudioLoading && (
                         <div className="w-full bg-indigo-950/50 rounded-full h-2 mb-6 max-w-xs mx-auto overflow-hidden">
                            <div className="bg-white h-2 transition-all duration-300" style={{ width: `${podcastProgress}%` }}></div>
                         </div>
                      )}

                      <div className="flex flex-col items-center gap-6">
                        <audio 
                          ref={audioRef} 
                          src={audioUrl || undefined} 
                          onTimeUpdate={() => setAudioProgress(audioRef.current?.currentTime || 0)}
                          onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden" 
                        />
                        
                        <div className="w-full flex flex-col gap-2 max-w-sm">
                           <input type="range" min="0" max={audioDuration || 100} value={audioProgress} onChange={(e) => { if(audioRef.current){ audioRef.current.currentTime = Number(e.target.value); setAudioProgress(Number(e.target.value)); } }} className="w-full accent-white" />
                           <div className="flex justify-between text-xs text-indigo-300 font-mono">
                             <span>{Math.floor(audioProgress/60)}:{Math.floor(audioProgress%60).toString().padStart(2,'0')}</span>
                             <span>{Math.floor(audioDuration/60)}:{Math.floor(audioDuration%60).toString().padStart(2,'0')}</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }} className="text-white hover:text-indigo-300 transition" title="-10s"><Rewind className="w-7 h-7" /></button>
                           <button onClick={togglePodcast} disabled={isAudioLoading} className="bg-white text-indigo-900 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg disabled:opacity-50">
                             {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                           </button>
                           <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }} className="text-white hover:text-indigo-300 transition" title="+10s"><FastForward className="w-7 h-7" /></button>
                        </div>
                        
                        {tier === 'pro' && (
                          <div className="pt-6 border-t border-indigo-500/30 w-full mt-4">
                            <button onClick={handleAskProfessor} className="flex items-center justify-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-md">
                              <MessageCircleQuestion className="w-5 h-5" /> Ask Professor (Audio Q&A)
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

      {/* Slideout Chat */}
      {chatOpen && (
        <div className={`fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-700 transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <img src="/hazelnote_tutor.png" className="w-10 h-10 rounded-full object-cover aspect-square border-2 border-green-500 bg-green-900/30" />
              <div><h3 className="font-extrabold text-white text-base">Professor Hazel</h3><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs text-green-400 font-bold">Online AI Tutor</span></div></div>
            </div>
            <button onClick={() => { setChatOpen(false); setSidebarCollapsed(false); }} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900 flex flex-col">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 max-w-[90%] animate-slide-in ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? <img src="/hazelnote_tutor.png" className="w-8 h-8 rounded-full flex-shrink-0 object-cover aspect-square bg-white" /> : <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">U</div>}
                <div className={`p-3 text-sm rounded-2xl ${msg.role === 'ai' ? 'bg-gray-800 border border-gray-700 rounded-tl-sm text-gray-200' : 'bg-green-500 text-white rounded-tr-sm'}`} dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-800 border-t border-gray-700">
             {chatFile && (
                <div className="mb-3 flex items-center gap-2 bg-gray-700 p-2 rounded-lg text-xs font-medium text-gray-300 shadow-sm">
                   <Paperclip className="w-3.5 h-3.5 text-green-400" /> {chatFile.name}
                   <button onClick={() => setChatFile(null)} className="ml-auto text-red-400 hover:text-red-300 transition p-1 hover:bg-gray-600 rounded"><X className="w-3 h-3" /></button>
                </div>
             )}
             <div className="flex gap-2 items-center">
                <input type="file" id="chat-attachment" className="hidden" accept="image/*,.pdf" onChange={e => setChatFile(e.target.files?.[0] || null)} />
                <label htmlFor="chat-attachment" className="p-3 bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 rounded-xl cursor-pointer transition shadow-sm">
                   <Paperclip className="w-5 h-5" />
                </label>
                <input 
                   type="text" 
                   value={chatInput} 
                   onChange={e=>setChatInput(e.target.value)} 
                   onKeyPress={e=>e.key==='Enter'&&sendChatMessage()} 
                   onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                   className="flex-1 border border-gray-600 bg-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" 
                   placeholder="Ask a question..." 
                />
                <button onClick={sendChatMessage} className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition shadow-sm"><Send className="w-5 h-5" /></button>
             </div>
          </div>
        </div>
      )}

      {/* Modals */}
      
      {/* Folder Create/Edit Modal */}
      {folderModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                 {folderModal.type === 'create' ? <FolderPlus className="text-green-400 w-5 h-5" /> : <Edit2 className="text-blue-400 w-5 h-5" />}
                 {folderModal.type === 'create' ? 'New Folder' : 'Edit Folder'}
              </h3>
              <button onClick={() => setFolderModal({...folderModal, isOpen: false})} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
               <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Folder Emoji</label>
                  <input type="text" maxLength={2} value={folderModal.emoji} onChange={e=>setFolderModal({...folderModal, emoji: e.target.value})} className="w-full text-center text-3xl bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 text-white" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Folder Name</label>
                  <input type="text" value={folderModal.name} onChange={e=>setFolderModal({...folderModal, name: e.target.value})} placeholder="e.g. Science 101" className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 text-white font-bold" />
               </div>
               <div className="pt-2 flex flex-col gap-2">
                 <button onClick={handleSaveFolder} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-md">
                   {folderModal.type === 'create' ? 'Create Folder' : 'Save Changes'}
                 </button>
                 {folderModal.type === 'edit' && folderModal.folderId && (
                    <button onClick={() => deleteFolder(folderModal.folderId!)} className="w-full py-3 bg-red-900/30 text-red-400 rounded-xl font-bold hover:bg-red-900/50 transition">
                      Delete Folder
                    </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Context Modal (Pro) */}
      {addContextModalOpen && (
        <div className="fixed inset-0 bg-gray-900/70 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-700 overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-indigo-900/20">
              <div>
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2"><Network className="text-indigo-400 w-6 h-6" /> Add Context (Pro)</h3>
                <p className="text-xs text-indigo-300 mt-1">Provide more material for AI to merge into these notes seamlessly.</p>
              </div>
              <button onClick={() => setAddContextModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-900/50 p-1.5 rounded-[20px] flex flex-col sm:flex-row gap-1 mb-6 border border-gray-700">
                <button onClick={() => setContextInputMode('pdf')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode === 'pdf' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><FileUp className="w-4 h-4" /> PDF</button>
                <button onClick={() => setContextInputMode('voice')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode === 'voice' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><Mic className="w-4 h-4" /> Text/Dictate</button>
                <button onClick={() => setContextInputMode('link')} className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${contextInputMode === 'link' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}><LinkIcon className="w-4 h-4" /> YouTube URL</button>
              </div>

              {contextInputMode === 'pdf' && (
                <div className="text-center border-2 border-dashed border-gray-600 rounded-[24px] p-8 bg-gray-900/30">
                  <input type="file" id="context-pdf" multiple accept=".pdf" className="hidden" onChange={(e)=>{
                     const files = Array.from(e.target.files || []);
                     setContextPdfFiles(prev => [...prev, ...files]);
                  }} />
                  <label htmlFor="context-pdf" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl cursor-pointer font-bold inline-flex items-center gap-2 transition shadow-md">
                     <FileUp className="w-4 h-4" /> Select PDFs
                  </label>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {contextPdfFiles.map((file, i) => (
                      <span key={i} className="bg-indigo-900/40 text-indigo-300 text-xs px-3 py-1.5 rounded-full font-bold border border-indigo-800 flex items-center gap-2">
                        {file.name}
                        <button onClick={() => setContextPdfFiles(contextPdfFiles.filter((_, idx)=>idx!==i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {contextInputMode === 'voice' && (
                <textarea value={contextVoiceText} onChange={e=>setContextVoiceText(e.target.value)} className="w-full h-48 p-4 border border-gray-600 rounded-2xl focus:outline-none focus:border-indigo-500 bg-gray-900 text-white" placeholder="Type or dictate additional context..." />
              )}
              {contextInputMode === 'link' && (
                <input type="text" id="context-url-input" onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} className="w-full border border-gray-600 rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 bg-gray-900 text-white" placeholder="Paste a YouTube URL here..." />
              )}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800">
               <button 
                  onClick={handleAddContext} 
                  disabled={isAddingContextLoading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isAddingContextLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Network className="w-5 h-5" />}
                 {isAddingContextLoading ? 'Integrating into Notes...' : 'Integrate Context'}
               </button>
            </div>
          </div>
        </div>
      )}

      {translateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="font-extrabold text-xl text-white flex items-center gap-2"><Languages className="text-blue-400" /> Translate Study Set</h3><button onClick={() => setTranslateModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              {translateProgress >= 0 ? (
                 <div className="space-y-3 py-4">
                    <div className="flex justify-between text-sm text-gray-300 font-bold"><span>Translating all content...</span><span>{Math.round(translateProgress)}%</span></div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner"><div className="bg-blue-500 h-3 transition-all duration-300 ease-out" style={{ width: `${translateProgress}%` }}></div></div>
                 </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Translate entire document to:</label>
                    <select id="translate-language" className="w-full border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-gray-700 font-medium text-white">
                      <option value="Urdu">اردو — Urdu</option><option value="Arabic">عربي — Arabic</option><option value="French">Français — French</option><option value="Spanish">Español — Spanish</option><option value="German">Deutsch — German</option>
                    </select>
                  </div>
                  <button onClick={translateNotes} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"><Languages className="w-4 h-4" /> Translate Now</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Ask Professor Modal */}
      {askModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2"><MessageCircleQuestion className="text-indigo-400" /> Audio Q&A with Professor</h3>
                <button onClick={() => { isAskModalOpenRef.current = false; setAskModalOpen(false); stopProfSpeaking(); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-8 text-center">Tap the microphone and ask your question aloud.</p>
                
                <button 
                   onClick={toggleAskRecording}
                   className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${isAskRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'}`}
                >
                   {isAskRecording ? <Square className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                </button>
                <div className="mt-4 font-bold text-lg text-white">
                   {isAskRecording ? 'Listening... Tap to stop' : 'Tap to start recording'}
                </div>

                {askResponse && (
                  <div className="mt-8 w-full bg-indigo-900/20 border border-indigo-800/50 p-5 rounded-xl text-left animate-slide-in relative">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <img src="/hazelnote_tutor.png" className="w-6 h-6 rounded-full object-cover aspect-square bg-white" />
                           <span className="text-indigo-300 font-bold text-sm">Professor Hazel</span>
                        </div>
                        {isProfSpeaking && (
                           <button onClick={stopProfSpeaking} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-bold bg-red-900/30 px-2 py-1 rounded">
                             <StopCircle className="w-4 h-4" /> Stop
                           </button>
                        )}
                     </div>
                     <div className="text-gray-200 text-sm leading-relaxed prose-sm prose-invert" dangerouslySetInnerHTML={{__html: askResponse}} />
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {goProModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-[32px] w-full max-w-md shadow-2xl border border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="w-8 h-8 text-white" /></div>
            <h3 className="text-2xl font-extrabold text-white mb-3">Upgrade to Pro</h3>
            <p className="text-gray-400 mb-6">{tier === 'free' && stats.monthlySets?.[getCurrentMonth()] >= 2 ? "You've reached your monthly limit of 2 study sets." : "Unlock unlimited study sets, advanced editing, and more!"}</p>
            <div className="flex gap-3"><button onClick={() => setGoProModalOpen(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold">Maybe Later</button><Link href="/pricing/" onClick={() => setGoProModalOpen(false)} className="flex-1 py-3 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-xl font-bold">View Plans</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}
