"use client";
import { ArrowRight, BookOpen, Brain, Zap, Clock, Star, LayoutDashboard, Mic, FileUp, CheckCircle2, Bot } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-[#0F172A] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#10B981] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/hazelnote_logo.png" alt="HazelNote" className="w-12 h-8 object-fill rounded" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white leading-none">HazelNote</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">by free-ed</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-white transition">Features</a>
            <a href="/pricing" className="text-sm font-semibold text-gray-300 hover:text-white transition">Pricing</a>
            <a href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition">Sign In</a>
            <a href="/login" className="bg-[#10B981] hover:bg-[#059669] px-5 py-2.5 rounded-full text-sm font-bold transition shadow-lg shadow-emerald-900/20">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            HazelNote AI is Live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Turn any lecture into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">perfect notes</span> instantly.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, dictate live lectures, or paste YouTube links. HazelNote creates study guides, flashcards, and exams in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/login" className="w-full sm:w-auto px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition flex items-center justify-center gap-2 text-lg shadow-xl shadow-emerald-900/20">
              Start Studying Free <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Meet Professor Hazel Card */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-900/40 to-slate-800/80 border border-emerald-500/20 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px]"></div>
            <img src="/hazelnote_tutor.png" alt="Professor Hazel" className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-3xl shadow-2xl z-10 border-4 border-emerald-500/20" />
            <div className="z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase tracking-widest text-sm"><Bot className="w-5 h-5"/> Meet Your AI Tutor</div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Professor Hazel</h2>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6">
                    Got a question about your notes? Stuck on a complex topic? Professor Hazel is embedded directly into your workspace to answer questions, explain concepts simply, and test your knowledge on the fly.
                </p>
            </div>
        </div>
      </section>

      {/* How it Works (3 Steps) */}
      <section className="py-20 px-6 border-t border-gray-800/50 bg-[#151E2E]">
          <div className="max-w-5xl mx-auto text-center">
             <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-16 tracking-tight">
                HazelNote keeps it <span className="text-[#10B981]">simple.</span>
             </h2>
             
             <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                <div className="flex flex-col items-center max-w-[220px]">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg border border-slate-700">
                        <FileUp className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-xl text-white text-center">1. Upload</h3>
                    <p className="text-base text-gray-400 text-center mt-3 leading-relaxed">Upload PDFs, dictate lectures, or paste YouTube URLs directly.</p>
                </div>
                
                <div className="hidden md:block h-px w-24 bg-gray-700 -mt-16"></div>
                
                <div className="flex flex-col items-center max-w-[220px]">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg border border-slate-700">
                        <FileText className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-xl text-white text-center">2. Get Notes</h3>
                    <p className="text-base text-gray-400 text-center mt-3 leading-relaxed">Get perfectly organized study materials structured instantly.</p>
                </div>

                <div className="hidden md:block h-px w-24 bg-gray-700 -mt-16"></div>
                
                <div className="flex flex-col items-center max-w-[220px]">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-lg border border-slate-700">
                        <CheckCircle2 className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-xl text-white text-center">3. Review & Ace</h3>
                    <p className="text-base text-gray-400 text-center mt-3 leading-relaxed">Master topics with AI flashcards, quizzes, and live grading.</p>
                </div>
             </div>
          </div>
      </section>

      {/* 6 Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Everything you need to <span className="text-emerald-400">Excel</span></h2>
            <p className="text-gray-400 text-lg">Built for students who want to study smarter, not harder.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6"><BookOpen className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
              <p className="text-gray-400 leading-relaxed">Instantly generated flashcards from your notes to help you memorize key terms effortlessly.</p>
            </div>
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6"><Brain className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">Custom Practice Exams</h3>
              <p className="text-gray-400 leading-relaxed">Generate rigorous MCQ and written exams tailored to standard curriculums (IB, SAT, A-Levels).</p>
            </div>
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6"><Zap className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">YouTube to Notes</h3>
              <p className="text-gray-400 leading-relaxed">Paste any educational YouTube link and watch it magically transform into a comprehensive study guide.</p>
            </div>
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-6"><Clock className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">Live Voice Dictation</h3>
              <p className="text-gray-400 leading-relaxed">Record your professor's lecture live in class, and let HazelNote clean up the transcript automatically.</p>
            </div>
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mb-6"><Star className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">AI Essay Grading</h3>
              <p className="text-gray-400 leading-relaxed">Submit your structured answers and essays for instant feedback, rubrics, and improvement tips.</p>
            </div>
            <div className="bg-slate-800/50 border border-gray-700 p-8 rounded-3xl hover:bg-slate-800 transition">
              <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-6"><LayoutDashboard className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold mb-3">Organized Workspaces</h3>
              <p className="text-gray-400 leading-relaxed">Keep all your subjects perfectly sorted in folders, allowing you to track your daily study streaks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" alt="Logo" className="w-8 h-6 rounded" />
            <span className="font-extrabold text-lg">HazelNote</span>
          </div>
          <div className="text-gray-500 text-sm">© 2024 free-ed. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition">Terms</a>
            <a href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
