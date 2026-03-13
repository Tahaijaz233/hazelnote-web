'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Search, FileText, List, Clock, Award, Save, Sparkles, Bot,
  CheckCircle, XCircle, BookOpen, Target,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { renderMarkdownWithMath } from '@/lib/utils';

interface StudySet { id: number; title: string; date: string; summary: string; flashcardCount: number; quizCount: number; parts: string[]; podcast: string; chatCount: number; folderId?: string; }

const safeParseJSON = <T,>(key: string, fallback: T): T => { if (typeof window === 'undefined') return fallback; try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch { return fallback; } };
const saveToStorage = (key: string, value: any) => { if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value)); };

interface MarkingResult {
  score: number;
  maxScore: number;
  strengths: string;
  improvements: string;
  studyTips: string;
}

export default function Exam() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [studyHistory, setStudyHistory] = useState<StudySet[]>([]);

  const [selectedBoard, setSelectedBoard] = useState('general');
  const [selectedStudySets, setSelectedStudySets] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questionType, setQuestionType] = useState('mcq');
  const [questionCount, setQuestionCount] = useState(5);

  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isMarkingExam, setIsMarkingExam] = useState(false);
  const [examInProgress, setExamInProgress] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [examSaved, setExamSaved] = useState(false);
  const [markingResults, setMarkingResults] = useState<MarkingResult[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'profiles', u.uid));
        if (snap.exists()) {
          const p = snap.data();
          setTier(p.is_pro ? 'pro' : 'free');
        }
      }
    });
    setStudyHistory(safeParseJSON('hz_study_history', []));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examInProgress && timeRemaining > 0 && timeLimit !== '0') {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { submitExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examInProgress, timeRemaining, timeLimit]);

  useEffect(() => {
    if (questionType === 'essay' && questionCount > 10) setQuestionCount(10);
    if (questionType === 'structured' && questionCount > 20) setQuestionCount(20);
  }, [questionType, questionCount]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getAvailableCounts = () => {
    if (questionType === 'mcq') return [5, 10, 20, 30];
    if (questionType === 'structured') return [5, 10, 20];
    return [5, 10]; 
  };

  const toggleStudySetSelection = (id: number) => {
    setSelectedStudySets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const callGemini = async (systemPrompt: string, userText: string, isJson: boolean = false): Promise<string> => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userText, responseFormat: isJson ? 'json' : undefined }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.result) throw new Error('Empty response from AI. Please try again.');
    return data.result;
  };

  const parseJSONResponse = (raw: string) => {
    let cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonArrayStart = cleanJson.indexOf('[');
    const jsonArrayEnd = cleanJson.lastIndexOf(']');
    if (jsonArrayStart !== -1 && jsonArrayEnd !== -1) {
      cleanJson = cleanJson.substring(jsonArrayStart, jsonArrayEnd + 1);
    }
    return JSON.parse(cleanJson);
  };

  const parseJSONObjectResponse = (raw: string) => {
    let cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonObjectStart = cleanJson.indexOf('{');
    const jsonObjectEnd = cleanJson.lastIndexOf('}');
    if (jsonObjectStart !== -1 && jsonObjectEnd !== -1) {
      cleanJson = cleanJson.substring(jsonObjectStart, jsonObjectEnd + 1);
    }
    return JSON.parse(cleanJson);
  };

  const generateExam = async () => {
    if (selectedStudySets.length === 0) { alert('Please select at least one study set!'); return; }
    const materials = selectedStudySets
      .map(id => studyHistory.find(s => s.id === id)?.parts[2] || '')
      .join('\n\n=== NEXT SOURCE ===\n\n');

    if (!materials.trim()) { alert('Selected study sets are empty.'); return; }

    setIsGeneratingExam(true);
    try {
      if (questionType === 'mcq') {
        const prompt = `Based on the following study material, create ${questionCount} multiple choice questions at ${difficulty} difficulty.

Return ONLY a valid JSON array of objects with this EXACT structure (do not include markdown block markers):
[
  {
    "question": "Question text here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "A"
  }
]

Study Material:
${materials}`;

        const raw = await callGemini(prompt, '', true);
        const jsonQuestions = parseJSONResponse(raw);
        
        if (!Array.isArray(jsonQuestions) || jsonQuestions.length === 0) throw new Error('Could not parse questions. Please try again.');
        
        const formattedQuestions = jsonQuestions.map((q: any) => ({
          question: q.question,
          options: q.options,
          answer: q.answer.trim().toUpperCase(),
          type: 'mcq'
        }));
        setExamQuestions(formattedQuestions);

      } else if (questionType === 'structured') {
        const prompt = `Based on the following study material, create ${questionCount} structured short-answer questions at ${difficulty} difficulty.
Each question should require a detailed written response of 3–5 sentences covering key concepts.

Return ONLY a valid JSON array of objects with this EXACT structure (do not include markdown block markers):
[
  {
    "question": "Question requiring detailed explanation",
    "modelAnswer": "Comprehensive model answer covering all key points, 3-5 sentences"
  }
]

Study Material:
${materials}`;

        const raw = await callGemini(prompt, '', true);
        const jsonQuestions = parseJSONResponse(raw);
        
        if (!Array.isArray(jsonQuestions) || jsonQuestions.length === 0) throw new Error('Could not parse structured questions.');
        
        const formattedQuestions = jsonQuestions.map((q: any) => ({
          question: q.question,
          modelAnswer: q.modelAnswer,
          type: 'structured'
        }));
        setExamQuestions(formattedQuestions);

      } else if (questionType === 'essay') {
        const count = Math.min(questionCount, tier === 'pro' ? questionCount : 1);
        const prompt = `Based on the following study material, create ${count} essay question(s) at ${difficulty} difficulty.
Each question requires a comprehensive, well-structured essay response.

Return ONLY a valid JSON array of objects with this EXACT structure (do not include markdown block markers):
[
  {
    "question": "Essay question requiring extended analysis and argumentation",
    "criteria": "Key points that must be addressed for full marks, separated by semicolons"
  }
]

Study Material:
${materials}`;

        const raw = await callGemini(prompt, '', true);
        const jsonQuestions = parseJSONResponse(raw);

        if (!Array.isArray(jsonQuestions) || jsonQuestions.length === 0) throw new Error('Could not parse essay questions.');
        
        const formattedQuestions = jsonQuestions.map((q: any) => ({
          question: q.question,
          criteria: q.criteria,
          type: 'essay'
        }));
        setExamQuestions(formattedQuestions);
      }

      setExamInProgress(true);
      setTimeRemaining(parseInt(timeLimit) * 60);
      setUserAnswers({});
      setExamSaved(false);
      setMarkingResults([]);
    } catch (e: any) {
      alert('Failed to generate exam: ' + e.message);
    }
    setIsGeneratingExam(false);
  };

  const submitExam = async () => {
    setExamInProgress(false);

    if (questionType === 'mcq') {
      let correct = 0;
      examQuestions.forEach((q, i) => { if (userAnswers[i] === q.answer) correct++; });
      setScore(correct);
      setExamCompleted(true);
    } else {
      setIsMarkingExam(true);
      const results: MarkingResult[] = [];

      for (const [i, q] of examQuestions.entries()) {
        const studentAnswer = (userAnswers[i] || '').trim();
        if (!studentAnswer) {
          results.push({ score: 0, maxScore: 10, strengths: 'No answer provided.', improvements: 'You must attempt this question.', studyTips: 'Review the topic thoroughly before your next attempt.' });
          continue;
        }

        const contextLine = q.modelAnswer
          ? `Model Answer: ${q.modelAnswer}`
          : q.criteria
            ? `Marking Criteria: ${q.criteria}`
            : '';

        const prompt = `You are a fair and constructive expert examiner. Mark this student answer.
Question: ${q.question}
${contextLine}
Student Answer: ${studentAnswer}

Return ONLY a valid JSON object with this EXACT structure (no markdown block markers):
{
  "score": 7,
  "strengths": "what was correct, well-expressed, or showed good understanding",
  "improvements": "specific gaps, errors, or missing concepts",
  "studyTips": "concrete topics/concepts the student should review to improve"
}`;

        try {
          const raw = await callGemini(prompt, '', true);
          const resultJson = parseJSONObjectResponse(raw);
          
          results.push({
            score: typeof resultJson.score === 'number' ? Math.min(10, Math.max(0, resultJson.score)) : 5,
            maxScore: 10,
            strengths: resultJson.strengths || 'Some correct points noted.',
            improvements: resultJson.improvements || 'Review key concepts.',
            studyTips: resultJson.studyTips || 'Revisit your study notes.',
          });
        } catch (e) {
          console.error("Marking error", e);
          results.push({ score: 0, maxScore: 10, strengths: 'Could not mark answer reliably.', improvements: 'Please try again.', studyTips: '' });
        }
      }

      const totalScore = results.reduce((a, r) => a + r.score, 0);
      const totalMax = results.reduce((a, r) => a + r.maxScore, 0);
      setScore(Math.round((totalScore / (totalMax || 1)) * examQuestions.length));
      setMarkingResults(results);
      setIsMarkingExam(false);
      setExamCompleted(true);
    }
  };

  const startNewExam = () => {
    setExamInProgress(false); setExamCompleted(false);
    setExamQuestions([]); setUserAnswers({}); setScore(0); setExamSaved(false);
    setMarkingResults([]);
  };

  const saveExamToFolder = () => {
    if (tier !== 'pro') { alert('Saving exams is a Pro feature. Upgrade to unlock!'); return; }

    const folders = safeParseJSON<any[]>('hz_folders', []);
    let examFolder = folders.find((f: any) => f.name === 'Exams');
    const newFolders = [...folders];
    if (!examFolder) {
      examFolder = { id: `folder_exams_${Date.now()}`, name: 'Exams', emoji: '📝' };
      newFolders.push(examFolder);
      saveToStorage('hz_folders', newFolders);
    }

    const quizText = examQuestions.map((q: any, i: number) => {
      if (q.type === 'mcq') {
        const opts = q.options.map((o: string, j: number) => `${String.fromCharCode(65 + j)}) ${o}`).join('\n');
        return `### Q${i + 1}: ${q.question}\n\n${opts}\n\n**Correct Answer:** ${q.answer}\n**Your Answer:** ${userAnswers[i] || 'None'}\n**Result:** ${userAnswers[i] === q.answer ? '✅ Correct' : '❌ Incorrect'}`;
      } else {
        const res = markingResults[i];
        return `### Q${i + 1}: ${q.question}\n\n**Your Answer:**\n${userAnswers[i] || '(no answer)'}\n\n**Score:** ${res?.score ?? '?'}/${res?.maxScore ?? 10}\n\n**Feedback:**\n- **Strengths:** ${res?.strengths}\n- **Improvements:** ${res?.improvements}\n- **Study Tips:** ${res?.studyTips}`;
      }
    }).join('\n\n---\n\n');

    const sourceTitles = selectedStudySets.map(id => studyHistory.find(s => s.id === id)?.title).filter(Boolean).join(', ') || 'Study Sets';
    const totalScore = questionType === 'mcq'
      ? score
      : markingResults.reduce((a, r) => a + r.score, 0);
    const totalMax = questionType === 'mcq' ? examQuestions.length : markingResults.reduce((a, r) => a + r.maxScore, 0);
    const pct = Math.round((totalScore / (totalMax || 1)) * 100);

    const savedSet: StudySet = {
      id: Date.now(),
      title: `Exam: ${sourceTitles.substring(0, 50)}${sourceTitles.length > 50 ? '...' : ''}`,
      date: new Date().toISOString(),
      summary: `Score: ${totalScore}/${totalMax} (${pct}%) — ${difficulty} difficulty, ${examQuestions.length} ${questionType} questions.`,
      flashcardCount: 0,
      quizCount: examQuestions.length,
      parts: [
        `Exam: ${sourceTitles}`,
        `Score: ${totalScore}/${totalMax} (${pct}%)`,
        `## Exam Results\n\n**Score:** ${totalScore}/${totalMax} (${pct}%)\n**Type:** ${questionType}\n**Difficulty:** ${difficulty}\n**Questions:** ${examQuestions.length}\n**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n${quizText}`,
        '',
        '',
      ],
      podcast: '',
      chatCount: 0,
      folderId: examFolder.id,
    };

    const history = safeParseJSON<any[]>('hz_study_history', []);
    saveToStorage('hz_study_history', [savedSet, ...history].slice(0, 50));
    setExamSaved(true);
    alert('Exam saved to the "Exams" folder in your Dashboard!');
  };

  const boards = [
    { id: 'general', label: 'General' }, { id: 'caie', label: 'CAIE (O/A Level)' },
    { id: 'edexcel', label: 'Edexcel' }, { id: 'aqa', label: 'AQA' },
    { id: 'ib', label: 'IB' }, { id: 'sat', label: 'SAT / AP' }, { id: 'fbise', label: 'FBISE / Matric' },
  ];

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
        <Link href="/exam/" className="w-full text-left sidebar-item active flex items-center gap-3"><ClipboardList className="w-5 h-5" /> Take an Exam</Link>
        <Link href="/professor/" className="w-full text-left sidebar-item flex items-center gap-3"><Bot className="w-5 h-5" /> Professor Hazel</Link>
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
      <main className="flex-1 h-full overflow-y-auto relative">
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

        <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Take an Exam</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Generate a customised exam based on your notes.</p>

          {!examInProgress && !examCompleted && !isMarkingExam && (
            <div className="space-y-6">
              <div className="glass-card p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-purple-500" /> Board / Curriculum <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span></h3>
                <div className="flex flex-wrap gap-2">
                  {boards.map(b => (
                    <button key={b.id} onClick={() => setSelectedBoard(b.id)} className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition ${selectedBoard === b.id ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-300'}`}>{b.label}</button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-green-500" /> Select Notes</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {studyHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 font-medium">No study sets yet. Create one in the Dashboard first!</p>
                  ) : studyHistory.map(set => (
                    <label key={set.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${selectedStudySets.includes(set.id) ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <input type="checkbox" checked={selectedStudySets.includes(set.id)} onChange={() => toggleStudySetSelection(set.id)} className="accent-green-500 w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{set.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(set.date).toLocaleDateString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 dark:text-white font-medium focus:outline-none focus:border-green-500">
                    <option value="easy">Easy — Foundation</option>
                    <option value="medium">Medium — Standard</option>
                    <option value="hard">Hard — Advanced</option>
                  </select>
                </div>
                <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time Limit</label>
                  <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 dark:text-white font-medium focus:outline-none focus:border-green-500">
                    <option value="0">No time limit</option>
                    <option value="10">10 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><List className="w-5 h-5 text-blue-500" /> Question Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'mcq', label: 'MCQ', desc: 'Multiple choice — auto-marked', pro: false },
                    { id: 'structured', label: 'Structured', desc: 'Short-answer with AI marking', pro: true },
                    { id: 'essay', label: 'Essay', desc: 'Long-form with AI marking', pro: true },
                  ].map(qt => (
                    <button key={qt.id}
                      onClick={() => {
                        if (qt.pro && tier !== 'pro') { alert('Structured and Essay questions require a Pro plan. Upgrade to unlock AI marking!'); return; }
                        setQuestionType(qt.id);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition ${questionType === qt.id ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'} ${qt.pro && tier !== 'pro' ? 'opacity-60' : ''}`}>
                      <div className={`font-bold mb-1 flex items-center gap-1.5 ${questionType === qt.id ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {qt.label}
                        {qt.pro && tier !== 'pro' && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Pro</span>}
                        {qt.pro && tier === 'pro' && <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-700">AI Marked</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{qt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Number of Questions</label>
                <div className="flex gap-2 flex-wrap">
                  {getAvailableCounts().map(count => (
                    <button key={count} onClick={() => tier === 'pro' || count === 5 ? setQuestionCount(count) : alert('Pro feature')}
                      className={`px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition ${questionCount === count ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'} ${tier !== 'pro' && count > 5 ? 'opacity-60' : ''}`}>
                      {count} {tier !== 'pro' && count > 5 && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-full">Pro</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{tier === 'pro' ? 'Pro plan: full access enabled.' : 'Free plan: 5 questions. Upgrade to Pro for full access.'}</p>
              </div>

              <button onClick={generateExam} disabled={isGeneratingExam} className="w-full btn-primary py-4 text-lg shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                {isGeneratingExam ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Generating Exam...</> : 'Generate Exam'}
              </button>
            </div>
          )}

          {isMarkingExam && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin block"></span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3">Professor Hazel is marking your exam…</h3>
              <p className="text-gray-400 text-sm">Analysing each answer and preparing detailed feedback. This may take a moment.</p>
            </div>
          )}

          {examInProgress && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Exam in Progress</h3>
                  {timeLimit !== '0' && <div className="mt-1 flex items-center gap-1.5 text-orange-600 font-bold"><Clock className="w-4 h-4" /> {formatTime(timeRemaining)}</div>}
                </div>
                <button onClick={submitExam} className="btn-primary px-6 py-2.5 font-bold">
                  {questionType === 'mcq' ? 'Submit Exam' : 'Submit for AI Marking'}
                </button>
              </div>
              <div className="space-y-8 glass-card p-6 md:p-10 dark:bg-gray-800 dark:border-gray-700">
                {examQuestions.map((q, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`${i + 1}. ${q.question}`) }} />

                    {q.type === 'mcq' && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, j: number) => {
                          const letter = String.fromCharCode(65 + j);
                          return (
                            <label key={j} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                              <input type="radio" name={`exam_q_${i}`} value={letter} checked={userAnswers[i] === letter} onChange={() => setUserAnswers(prev => ({ ...prev, [i]: letter }))} className="accent-green-500" />
                              <span className="dark:text-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`**${letter}.** ${opt}`) }} />
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'structured' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Answer (3–5 sentences)</label>
                        <textarea
                          value={userAnswers[i] || ''}
                          onChange={e => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          rows={5}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500 resize-none"
                          placeholder="Write your answer here..."
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{(userAnswers[i] || '').length} characters</p>
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Essay Response</label>
                        <textarea
                          value={userAnswers[i] || ''}
                          onChange={e => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          rows={12}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500 resize-none"
                          placeholder="Write your essay here. Use paragraphs and support your points with evidence from your studies..."
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{(userAnswers[i] || '').length} characters · ~{Math.ceil((userAnswers[i] || '').split(/\s+/).filter(Boolean).length)} words</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {examCompleted && (
            <div className="space-y-6">
              <div className="glass-card p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                {questionType === 'mcq' ? (
                  <>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Score: {score}/{examQuestions.length}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{Math.round((score / examQuestions.length) * 100)}% correct</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                      Total: {markingResults.reduce((a, r) => a + r.score, 0)}/{markingResults.reduce((a, r) => a + r.maxScore, 0)}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {Math.round((markingResults.reduce((a, r) => a + r.score, 0) / (markingResults.reduce((a, r) => a + r.maxScore, 0) || 1)) * 100)}% — AI-marked by Professor Hazel
                    </p>
                  </>
                )}
                <div className="flex gap-4 justify-center flex-wrap">
                  <button onClick={startNewExam} className="btn-primary px-6 py-3 font-bold">New Exam</button>
                  {!examSaved ? (
                    <button onClick={saveExamToFolder} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition border-2 ${tier === 'pro' ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      <Save className="w-4 h-4" /> Save to Exams Folder
                      {tier !== 'pro' && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full">Pro</span>}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-green-900/30 text-green-400 border-2 border-green-700">
                      <Sparkles className="w-4 h-4" /> Saved!
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-xl font-extrabold text-white">Review Answers</h4>

              {questionType === 'mcq' && examQuestions.map((q, i) => {
                const isCorrect = userAnswers[i] === q.answer;
                return (
                  <div key={i} className={`glass-card p-5 dark:border-gray-700 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <p className="font-bold text-white mb-2" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`${i + 1}. ${q.question}`) }} />
                    <div className="text-sm space-y-1">
                      <p className={isCorrect ? 'text-green-400 font-bold' : 'text-red-400'} dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`Your answer: ${userAnswers[i] ? `**${userAnswers[i]}**. ${q.options[userAnswers[i].charCodeAt(0) - 65] || ''}` : 'Not answered'}`) }} />
                      {!isCorrect && <p className="text-green-400 font-bold" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`Correct: **${q.answer}**. ${q.options[q.answer.charCodeAt(0) - 65] || ''}`) }} />}
                    </div>
                  </div>
                );
              })}

              {(questionType === 'structured' || questionType === 'essay') && examQuestions.map((q, i) => {
                const result = markingResults[i];
                const pct = result ? Math.round((result.score / result.maxScore) * 100) : 0;
                const color = pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red';
                return (
                  <div key={i} className={`glass-card p-6 dark:border-gray-700 border-l-4 ${color === 'green' ? 'border-l-green-500' : color === 'yellow' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-bold text-white flex-1 mr-4" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(`${i + 1}. ${q.question}`) }} />
                      {result && (
                        <span className={`shrink-0 text-lg font-extrabold px-3 py-1 rounded-full ${color === 'green' ? 'bg-green-900/30 text-green-400' : color === 'yellow' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                          {result.score}/{result.maxScore}
                        </span>
                      )}
                    </div>

                    {userAnswers[i] && (
                      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-300">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Answer</p>
                        <span dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(userAnswers[i]) }} />
                      </div>
                    )}

                    {result && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <div><span className="font-bold text-green-400">Strengths: </span><span className="text-gray-300" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(result.strengths) }} /></div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div><span className="font-bold text-red-400">Areas for Improvement: </span><span className="text-gray-300" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(result.improvements) }} /></div>
                        </div>
                        <div className="flex items-start gap-2 text-sm bg-indigo-900/20 border border-indigo-800/40 rounded-xl p-3">
                          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div><span className="font-bold text-indigo-400">How to Prepare: </span><span className="text-gray-300" dangerouslySetInnerHTML={{ __html: renderMarkdownWithMath(result.studyTips) }} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
