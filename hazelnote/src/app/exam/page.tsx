'use client';

import { useEffect, useState } from 'react';
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
  Search,
  FileText,
  List,
  Clock,
  Award,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeParseJSON, getCurrentMonth } from '@/lib/utils';
import { StudySet } from '@/types';

export default function Exam() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [studyHistory, setStudyHistory] = useState<StudySet[]>([]);
  
  // Exam settings
  const [selectedBoard, setSelectedBoard] = useState('general');
  const [selectedStudySet, setSelectedStudySet] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questionType, setQuestionType] = useState('mcq');
  const [questionCount, setQuestionCount] = useState(5);
  
  // Exam state
  const [examInProgress, setExamInProgress] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

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
        }
      }
    });

    setStudyHistory(safeParseJSON('hz_study_history', []));
    return () => unsubscribe();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examInProgress && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examInProgress, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateExam = async () => {
    if (!selectedStudySet) {
      alert('Please select a study set first!');
      return;
    }

    const studySet = studyHistory.find(s => s.id === selectedStudySet);
    if (!studySet) return;

    // Call API to generate exam questions
    try {
      const prompt = `Based on the following study material, create ${questionCount} ${questionType} questions at ${difficulty} difficulty level.
      
Study Material:
${studySet.parts[2]}

Format each question as:
QUESTION: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
ANSWER: [A/B/C/D]

Generate exactly ${questionCount} questions.`;

      const response = await fetch('/api/gemini/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: prompt, userText: '' }),
      });

      const data = await response.json();
      
      if (data.result) {
        // Parse questions
        const regex = /QUESTION:\s*([\s\S]*?)\s*A\)\s*([\s\S]*?)\s*B\)\s*([\s\S]*?)\s*C\)\s*([\s\S]*?)\s*D\)\s*([\s\S]*?)\s*ANSWER:\s*([A-D])/gi;
        const questions: any[] = [];
        let match;
        
        while ((match = regex.exec(data.result)) !== null) {
          questions.push({
            question: match[1].trim(),
            options: [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()],
            answer: match[6].trim().toUpperCase(),
          });
        }

        setExamQuestions(questions);
        setExamInProgress(true);
        setTimeRemaining(parseInt(timeLimit) * 60);
        setUserAnswers({});
      }
    } catch (e) {
      alert('Failed to generate exam. Please try again.');
    }
  };

  const submitExam = () => {
    let correct = 0;
    examQuestions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) correct++;
    });
    setScore(correct);
    setExamInProgress(false);
    setExamCompleted(true);
  };

  const startNewExam = () => {
    setExamInProgress(false);
    setExamCompleted(false);
    setExamQuestions([]);
    setUserAnswers({});
    setScore(0);
  };

  const boards = [
    { id: 'general', label: 'General' },
    { id: 'caie', label: 'CAIE (O/A Level)' },
    { id: 'edexcel', label: 'Edexcel' },
    { id: 'aqa', label: 'AQA' },
    { id: 'ib', label: 'IB' },
    { id: 'sat', label: 'SAT / AP' },
    { id: 'fbise', label: 'FBISE / Matric' },
  ];

  // Sidebar component
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
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition dark:text-gray-400 dark:hover:bg-gray-800">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link href="/dashboard/#create" className="w-full text-left sidebar-item flex items-center gap-3">
          <PlusCircle className="w-5 h-5" /> Create Notes
        </Link>
        <Link href="/exam/" className="w-full text-left sidebar-item active flex items-center gap-3">
          <ClipboardList className="w-5 h-5" /> Take an Exam
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {tier === 'free' && (
          <div className="mb-2">
            <Link href="/pricing/" className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">
              ⚡ Upgrade to Pro
            </Link>
          </div>
        )}
        <Link href="/profile/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <UserCircle className="w-5 h-5" /> Profile & Settings
        </Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <HelpCircle className="w-5 h-5" /> Support
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />
      )}

      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto relative">
        {/* Desktop hamburger menu button */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>

        {/* Mobile header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-lg text-gray-900 dark:text-white">HazelNote</span>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Take an Exam</h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Generate a customised exam based on your notes.</p>

          {!examInProgress && !examCompleted && (
            <div className="space-y-6">
              {/* Board Selection */}
              <div className="glass-card p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-500" /> Board / Curriculum <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => setSelectedBoard(board.id)}
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition ${
                        selectedBoard === board.id
                          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {board.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Notes */}
              <div className="glass-card p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" /> Select Notes
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {studyHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 font-medium">No study sets available. Please create one in the Dashboard first!</p>
                  ) : (
                    studyHistory.map((set, i) => (
                      <label
                        key={set.id}
                        onClick={() => setSelectedStudySet(set.id)}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                          selectedStudySet === set.id
                            ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input type="radio" name="exam_study_set" checked={selectedStudySet === set.id} onChange={() => setSelectedStudySet(set.id)} className="accent-green-500" />
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{set.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(set.date).toLocaleDateString()}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 dark:text-white font-medium focus:outline-none focus:border-green-500"
                  >
                    <option value="easy">Easy — Foundation</option>
                    <option value="medium">Medium — Standard</option>
                    <option value="hard">Hard — Advanced</option>
                  </select>
                </div>
                <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time Limit</label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 dark:text-white font-medium focus:outline-none focus:border-green-500"
                  >
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

              {/* Question Type */}
              <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-500" /> Question Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setQuestionType('mcq')}
                    className={`p-4 rounded-2xl border-2 text-left transition ${
                      questionType === 'mcq'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <div className={`font-bold mb-1 ${questionType === 'mcq' ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>MCQ</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Multiple choice — free</div>
                  </button>
                  <button
                    onClick={() => tier === 'pro' ? setQuestionType('structured') : alert('Pro feature')}
                    className={`p-4 rounded-2xl border-2 text-left transition ${
                      questionType === 'structured'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    } ${tier !== 'pro' ? 'opacity-60' : ''}`}
                  >
                    <div className={`font-bold mb-1 flex items-center gap-1.5 ${questionType === 'structured' ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Structured {tier !== 'pro' && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Pro</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Short answer with AI marking</div>
                  </button>
                  <button
                    onClick={() => tier === 'pro' ? setQuestionType('essay') : alert('Pro feature')}
                    className={`p-4 rounded-2xl border-2 text-left transition ${
                      questionType === 'essay'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                    } ${tier !== 'pro' ? 'opacity-60' : ''}`}
                  >
                    <div className={`font-bold mb-1 flex items-center gap-1.5 ${questionType === 'essay' ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Essay {tier !== 'pro' && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Pro</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Long-form with AI marking</div>
                  </button>
                </div>
              </div>

              {/* Question Count */}
              <div className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Number of Questions</label>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 20, 30].map((count) => (
                    <button
                      key={count}
                      onClick={() => tier === 'pro' || count === 5 ? setQuestionCount(count) : alert('Pro feature')}
                      className={`px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition ${
                        questionCount === count
                          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                      } ${tier !== 'pro' && count > 5 ? 'opacity-60' : ''}`}
                    >
                      {count} {tier !== 'pro' && count > 5 && <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-full">Pro</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{tier === 'pro' ? 'Pro plan: full access enabled.' : 'Free plan: 5 questions. Upgrade to Pro for full access.'}</p>
              </div>

              <button onClick={generateExam} className="w-full btn-primary py-4 text-lg shadow-xl dark:shadow-none">
                Generate Exam
              </button>
            </div>
          )}

          {/* Exam In Progress */}
          {examInProgress && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Exam</h3>
                  {timeLimit !== '0' && (
                    <div className="mt-1 flex items-center gap-1.5 text-orange-600 font-bold">
                      <Clock className="w-4 h-4" /> {formatTime(timeRemaining)}
                    </div>
                  )}
                </div>
                <button onClick={submitExam} className="btn-primary px-6 py-2.5 font-bold">Submit Exam</button>
              </div>
              <div className="space-y-8 glass-card p-6 md:p-10 dark:bg-gray-800 dark:border-gray-700">
                {examQuestions.map((q, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">{i + 1}. {q.question}</h4>
                    <div className="space-y-2">
                      {q.options.map((opt: string, j: number) => {
                        const letter = String.fromCharCode(65 + j);
                        return (
                          <label key={j} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <input
                              type="radio"
                              name={`exam_q_${i}`}
                              value={letter}
                              checked={userAnswers[i] === letter}
                              onChange={() => setUserAnswers(prev => ({ ...prev, [i]: letter }))}
                              className="accent-green-500"
                            />
                            <span className="dark:text-gray-200"><b>{letter}.</b> {opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Results */}
          {examCompleted && (
            <div>
              <div className="glass-card p-8 text-center mb-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Score: {score}/{examQuestions.length}</h3>
                <div className="flex gap-4 justify-center mt-6">
                  <button onClick={startNewExam} className="btn-primary px-6 py-3 font-bold">New Exam</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
