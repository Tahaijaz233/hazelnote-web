'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, PlayCircle, FileText, Layers, ClipboardCheck, Podcast, Bot, ClipboardList } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-green-400" />,
      title: 'Smart Notes',
      description: 'Upload PDFs, record voice notes, or paste YouTube videos. AI extracts key concepts and creates organized study materials instantly.',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: <Layers className="w-8 h-8 text-blue-400" />,
      title: 'Interactive Flashcards',
      description: 'Auto-generated flashcards with spaced repetition. Master any subject with active recall and smart review scheduling.',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: <ClipboardCheck className="w-8 h-8 text-purple-400" />,
      title: 'Practice Quizzes',
      description: 'Test your knowledge with AI-generated quizzes. Get instant feedback and identify weak areas to focus on.',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: <Podcast className="w-8 h-8 text-orange-400" />,
      title: 'AI Podcasts',
      description: 'Listen to your notes as engaging audio lessons. Perfect for learning on-the-go or during your commute.',
      bgColor: 'bg-orange-500/20',
    },
    {
      icon: <Bot className="w-8 h-8 text-pink-400" />,
      title: '24/7 AI Tutor',
      description: 'Chat with Professor Hazel anytime. Get explanations, clarifications, and study tips personalized to your notes.',
      bgColor: 'bg-pink-500/20',
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-red-400" />,
      title: 'Custom Exams',
      description: 'Create practice exams with adjustable difficulty and time limits. Simulate real exam conditions for better preparation.',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-[#0F172A]/70 backdrop-blur-xl border border-gray-800 rounded-full shadow-2xl">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
              <img src="/hazelnote_logo.png" alt="HazelNote" className="w-10 h-7 object-fill rounded-lg" />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-extrabold text-white leading-none">HazelNote</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">by free-ed</span>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-white font-bold transition text-sm">Home</Link>
                <Link href="/pricing/" className="text-gray-300 hover:text-white font-medium transition text-sm">Pricing</Link>
                {!isLoggedIn && (
                  <Link href="/login/" className="text-gray-300 hover:text-white font-medium transition text-sm">Sign In</Link>
                )}
              </div>
              <Link
                href={isLoggedIn ? "/dashboard/" : "/login/"}
                className="px-6 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition shadow-lg text-sm"
              >
                {isLoggedIn ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0F172A] opacity-95"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold mb-6 mt-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Study Workspace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Study Smarter with<br />
            <span className="gradient-text">AI-Powered Notes</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto px-4">
            Transform PDFs, voice notes, and videos into flashcards, quizzes, and interactive podcasts. Your personal AI study assistant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link
              href={isLoggedIn ? "/dashboard/" : "/login/"}
              className="px-8 py-4 btn-primary text-white font-bold rounded-full text-lg flex items-center justify-center gap-2 animate-pulse-glow"
            >
              {isLoggedIn ? 'Dashboard' : 'Start Learning Free'} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard/"
              className="px-8 py-4 bg-gray-800 border border-gray-700 text-white font-bold rounded-full text-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              Try Without Account <PlayCircle className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 relative px-4 animate-float">
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
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-16">
            How It <span className="gradient-text">Works</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: '1', color: 'text-green-400', bg: 'bg-green-500/20', title: 'Upload Content', desc: 'Drop your PDFs, record voice notes, or paste YouTube links' },
              { num: '2', color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'AI Processes', desc: 'Our AI analyzes and structures your content into study materials' },
              { num: '3', color: 'text-purple-400', bg: 'bg-purple-500/20', title: 'Study & Excel', desc: 'Use flashcards, quizzes, and podcasts to master the material' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`w-20 h-20 ${step.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <span className={`text-4xl font-extrabold ${step.color}`}>{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-900/30 to-blue-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            Choose Your <span className="gradient-text">Study Plan</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-10 px-4">
            Start free or unlock unlimited features with the Pro plan
          </p>
          <Link href="/pricing/" className="inline-block px-8 py-4 btn-primary text-white font-bold rounded-full text-lg shadow-lg">
            View Pricing Plans
          </Link>
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
              <li><Link href="/dashboard/" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link href="/pricing/" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/support/" className="hover:text-white transition">Help Center</Link></li>
              <li><a href="mailto:hazelnote@free-ed.site" className="hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/terms-of-service/" className="hover:text-white transition" target="_blank">Terms of Service</Link></li>
              <li><Link href="/privacy-policy/" className="hover:text-white transition" target="_blank">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          © 2026 HazelNote by free-ed. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
