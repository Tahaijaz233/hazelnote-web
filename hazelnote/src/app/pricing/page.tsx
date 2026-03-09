'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Pricing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const proPrice = billing === 'annual' ? '$5.10' : '$6';
  const proPeriod = billing === 'annual' ? '/mo (billed annually)' : '/mo';

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
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-gray-300 hover:text-white font-bold transition text-sm">Home</Link>
                <Link href="/pricing/" className="text-white font-medium transition text-sm">Pricing</Link>
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

      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight mt-8">Choose Your <span className="gradient-text">Study Plan</span></h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Start for free or unlock unlimited features with the Pro plan.</p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-gray-800/50 backdrop-blur-lg p-1.5 rounded-full inline-flex border border-gray-700">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition ${billing === 'monthly' ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${billing === 'annual' ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Annually <span className="text-[10px] bg-green-100/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">-15%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* FREE */}
            <div className="bg-gray-800/50 backdrop-blur-lg border-2 border-gray-700 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
              <h3 className="text-2xl font-extrabold text-white mb-2">Free</h3>
              <div className="mb-8 mt-4"><span className="text-5xl font-extrabold text-white">$0</span><span className="text-gray-400">/mo</span></div>
              <Link href="/login/" className="block w-full py-3 px-6 text-center bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition mb-8">Get Started Free</Link>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-gray-300">1 study set per month</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-gray-300">PDF upload (up to 5MB)</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-gray-300">Max 3 AI Tutor chats per set</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-gray-300">Standard Flashcards & Quizzes</span></div>
              </div>
            </div>
            
            {/* PRO */}
            <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 backdrop-blur-lg border-2 border-green-500 rounded-3xl p-8 relative transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2"><span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">UNLIMITED ACCESS</span></div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Pro</h3>
              <div className="mb-8 mt-4">
                <span className="text-5xl font-extrabold text-white">{proPrice}</span>
                <span className="text-gray-300 text-sm">{proPeriod}</span>
              </div>
              <Link href="/login/" className="block w-full py-3 px-6 text-center btn-primary text-white font-bold rounded-xl mb-8">Upgrade to Pro</Link>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-white font-semibold">Unlimited study sets</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-white">PDF upload (up to 500MB)</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-white">Unlimited AI Tutor chats</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-white">AI Podcasts & Translation</span></div>
                <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400" /><span className="text-white">Up to 30 Exam Questions</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
