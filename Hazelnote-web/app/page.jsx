"use client";
import { Sparkles, ArrowRight, PlayCircle, FileText, Layers, ClipboardCheck, Podcast, Bot, ClipboardList } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="antialiased bg-[#0F172A] min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
              <img src="/hazelnote_logo.png" alt="HazelNote" className="w-14 h-9 object-fill rounded-lg" />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-extrabold text-white leading-none">HazelNote</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">by free-ed</span>
              </div>
            </a>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <a href="/" className="text-white font-bold transition text-sm">Home</a>
                <a href="/pricing" className="text-gray-300 hover:text-white font-medium transition text-sm">Pricing</a>
                <a href="/login" className="text-gray-300 hover:text-white font-medium transition text-sm">Sign In</a>
              </div>
              <a href="/login" className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition shadow-lg text-sm">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0F172A] opacity-95"></div> 
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Study Workspace
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Study Smarter with<br/>
            <span className="gradient-text">AI-Powered Notes</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto px-4">
            Transform PDFs, voice notes, and videos into flashcards, quizzes, and interactive podcasts. Your personal AI study assistant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <a href="/login" className="px-8 py-4 btn-primary text-white font-bold rounded-full text-lg flex items-center justify-center gap-2 glow-animation">
              Start Learning Free <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/dashboard" className="px-8 py-4 bg-gray-800 border border-gray-700 text-white font-bold rounded-full text-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
              Try Without Account <PlayCircle className="w-5 h-5" />
            </a>
          </div>
          
          <div className="mt-16 relative px-4 float-animation">
            <div className="glass-card p-8 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl max-w-sm mx-auto">
              <img src="/hazelnote_tutor.png" alt="Professor Hazel" className="w-48 h-48 mx-auto mb-6 object-contain" />
              <p className="text-gray-300 text-lg font-bold">Meet Professor Hazel</p>
              <p className="text-gray-500 text-sm mt-1">Your 24/7 AI Study Companion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-16 px-4">
            Everything You Need to <span className="gradient-text">Ace Your Exams</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6"><FileText className="w-8 h-8 text-green-400" /></div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Notes</h3>
              <p className="text-gray-400 leading-relaxed">Upload PDFs, record voice notes, or paste YouTube videos. AI extracts key concepts and creates organized study materials instantly.</p>
            </div>
            {/* Additional feature cards similarly converted... */}
            <div className="feature-card bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6"><Layers className="w-8 h-8 text-blue-400" /></div>
              <h3 className="text-2xl font-bold text-white mb-3">Interactive Flashcards</h3>
              <p className="text-gray-400 leading-relaxed">Auto-generated flashcards with spaced repetition. Master any subject with active recall and smart review scheduling.</p>
            </div>
            <div className="feature-card bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6"><ClipboardCheck className="w-8 h-8 text-purple-400" /></div>
              <h3 className="text-2xl font-bold text-white mb-3">Practice Quizzes</h3>
              <p className="text-gray-400 leading-relaxed">Test your knowledge with AI-generated quizzes. Get instant feedback and identify weak areas to focus on.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/hazelnote_logo.png" alt="HazelNote" className="w-8 h-8 rounded-lg object-fill" />
              <span className="text-xl font-extrabold text-white">HazelNote</span>
            </div>
            <p className="text-gray-400 text-sm">AI-powered study workspace by <a href="https://free-ed.site" className="text-green-400 hover:underline">free-ed</a></p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
              <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/terms-of-service" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}