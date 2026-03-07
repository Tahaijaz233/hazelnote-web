"use client";
import { useState } from 'react';
import { Check, X, Zap, Crown } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="bg-[#0F172A] min-h-screen text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <img src="/hazelnote_logo.png" alt="HazelNote" className="w-14 h-9 object-fill rounded-lg" />
            <div className="flex flex-col justify-center">
              <span className="text-xl font-extrabold text-white leading-none">HazelNote</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">by free-ed</span>
            </div>
          </a>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-300 hover:text-white font-medium transition text-sm">Home</a>
              <a href="/pricing" className="text-white font-bold transition text-sm">Pricing</a>
              <a href="/login" className="text-gray-300 hover:text-white font-medium transition text-sm">Sign In</a>
            </div>
            <a href="/login" className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition shadow-lg text-sm">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">Choose Your <span className="text-[#10B981]">Study Plan</span></h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Start for free or unlock advanced features with Pro & Max plans</p>
          
          <div className="flex justify-center mb-10">
            <div className="bg-gray-800/50 backdrop-blur-lg p-1.5 rounded-full inline-flex border border-gray-700">
              <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full font-bold text-sm transition ${!isAnnual ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
              <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${isAnnual ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:text-white'}`}>
                Annually <span className="text-[10px] bg-emerald-100/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">-15%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {/* FREE */}
          <div className="bg-gray-800/50 backdrop-blur-lg border-2 border-gray-700 rounded-3xl p-8">
            <h3 className="text-2xl font-extrabold mb-2">Free</h3>
            <div className="mb-8 mt-4"><span className="text-5xl font-extrabold">$0</span><span className="text-gray-400">/mo</span></div>
            <a href="/login" className="block w-full py-3 px-6 text-center bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition mb-8">Get Started Free</a>
            <div className="space-y-4 text-sm md:text-base">
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span className="text-gray-300">1 study set per day limit</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span className="text-gray-300">PDF upload (up to 5MB)</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span className="text-gray-300">Max 2 AI Tutor chats per set</span></div>
              <div className="flex items-start gap-3 opacity-50"><X className="w-5 h-5 text-red-400 shrink-0" /><span className="text-gray-500">AI grading & Advanced limits</span></div>
            </div>
          </div>
          
          {/* PRO */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-blue-900/40 backdrop-blur-lg border-2 border-emerald-500 rounded-3xl p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2"><span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">MOST POPULAR</span></div>
            <h3 className="text-2xl font-extrabold mb-2">Pro</h3>
            <div className="mb-8 mt-4">
              <span className="text-5xl font-extrabold">{isAnnual ? '$5.10' : '$6'}</span>
              <span className="text-gray-300 text-sm">{isAnnual ? '/mo (billed annually)' : '/mo'}</span>
            </div>
            <a href="/login" className="block w-full py-3 px-6 text-center bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl mb-8 transition">Upgrade to Pro</a>
            <div className="space-y-4 text-sm md:text-base">
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span className="font-semibold">Unlimited daily study sets</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span>PDF upload (up to 50MB)</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span>Unlimited AI Tutor chats</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /><span>Up to 20 questions per exam</span></div>
            </div>
          </div>
          
          {/* MAX */}
          <div className="bg-gray-800/50 backdrop-blur-lg border-2 border-purple-500 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-24 h-24 text-purple-400" /></div>
            <h3 className="text-2xl font-extrabold mb-2">Max</h3>
            <div className="mb-8 mt-4">
              <span className="text-5xl font-extrabold">{isAnnual ? '$10.20' : '$12'}</span>
              <span className="text-gray-400 text-sm">{isAnnual ? '/mo (billed annually)' : '/mo'}</span>
            </div>
            <a href="/login" className="block w-full py-3 px-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold rounded-xl transition mb-8 shadow-lg shadow-purple-500/25 relative z-10 text-white">Upgrade to Max</a>
            <div className="space-y-4 relative z-10 text-sm md:text-base">
              <div className="flex items-start gap-3"><Zap className="w-5 h-5 text-purple-400 shrink-0" /><span className="font-semibold">Everything in Pro, plus:</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span>PDF upload (up to 100 MB)</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span>AI grading for long-form essays</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-purple-400 shrink-0" /><span>Up to 30 Questions per Exam Set</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
