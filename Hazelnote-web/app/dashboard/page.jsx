"use client";
import { useState } from 'react';
import { Mic, FileUp, Youtube, FileText, CheckCircle2, Download, Wand2, Brain, BookOpen } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function DashboardPage() {
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf', 'voice', 'youtube'
  const [isGenerating, setIsGenerating] = useState(false);
  const { generationsToday, setGenerationsToday, tier } = useAppContext();

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        triggerGenerate();
    }
  };

  const triggerGenerate = () => {
    if (tier === 'free' && generationsToday >= 1) {
        alert("You have reached your daily limit of 1 study set for the free tier. Please upgrade to Pro to generate more today!");
        return;
    }

    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationsToday(generationsToday + 1);
      alert("Notes Generated Successfully! (Backend logic to follow)");
    }, 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto pt-8 md:pt-16">
      
      {!isGenerating ? (
        <div className="animate-slide-in">
          {/* Coconote-Inspired Header */}
          <div className="text-center mb-16">
             <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                HazelNote keeps it <span className="text-[#10B981]">simple.</span>
             </h1>
             
             {/* 3 Steps Overview */}
             <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mt-12 mb-16">
                <div className="flex flex-col items-center max-w-[180px]">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <Mic className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center">1. Record or Upload</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Upload PDFs, dictate notes, or paste YouTube links.</p>
                </div>
                
                <div className="hidden md:block h-px w-16 bg-gray-200 dark:bg-slate-700 -mt-10"></div>
                
                <div className="flex flex-col items-center max-w-[180px]">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center">2. Get Notes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Get beautifully organized study materials in seconds.</p>
                </div>

                <div className="hidden md:block h-px w-16 bg-gray-200 dark:bg-slate-700 -mt-10"></div>
                
                <div className="flex flex-col items-center max-w-[180px]">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center">3. Review & Ace</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Master topics with AI flashcards and practice quizzes.</p>
                </div>
             </div>
          </div>

          {/* Creation Area */}
          <div className="max-w-3xl mx-auto">
            {/* Mode Selector */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-[32px] flex flex-col sm:flex-row gap-2 mb-8 shadow-sm border border-gray-100 dark:border-slate-700">
              <button onClick={() => setInputMode('pdf')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'pdf' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><FileUp className="w-4 h-4" /> PDF Upload</button>
              <button onClick={() => setInputMode('voice')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'voice' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Mic className="w-4 h-4" /> Voice Record</button>
              <button onClick={() => setInputMode('youtube')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'youtube' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Youtube className="w-4 h-4" /> YouTube</button>
            </div>

            {/* Inputs */}
            {inputMode === 'pdf' && (
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-10 text-center shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileUp className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Drop your study material here</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">We extract the text to instantly create smart materials.</p>
                <label className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-12 py-4 cursor-pointer inline-block shadow-lg shadow-green-200 dark:shadow-none text-lg transition">
                  Upload a pdf <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {inputMode === 'voice' && (
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-lg border border-gray-100 dark:border-slate-700 text-center">
                <textarea className="w-full h-40 p-5 border border-gray-200 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-[#10B981] bg-gray-50 dark:bg-slate-900 text-base resize-none" placeholder="Type or dictate your lecture notes..."></textarea>
                <button onClick={triggerGenerate} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-8 py-4 flex items-center justify-center gap-2 mx-auto mt-6 transition-all shadow-lg">
                   <Mic className="w-5 h-5" /> Start Dictation
                </button>
              </div>
            )}

            {inputMode === 'youtube' && (
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input type="text" className="flex-1 border border-gray-200 dark:border-slate-600 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#10B981] bg-gray-50 dark:bg-slate-900 text-base font-medium" placeholder="Paste YouTube URL here..." />
                  <button onClick={triggerGenerate} className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg"><Download className="w-5 h-5" /> Fetch</button>
                </div>
              </div>
            )}

            <div className="text-center mt-6">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {generationsToday} / 1 Daily Study Sets Used
                </span>
            </div>
          </div>
        </div>
      ) : (
        // Loading State
        <div className="max-w-2xl mx-auto mt-16 text-center bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 p-12 relative overflow-hidden shadow-xl">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Brain className="w-10 h-10 text-green-500 dark:text-green-400 animate-pulse" />
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Synthesizing Knowledge...</h3>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 animate-pulse">Reading content and generating study materials.</p>
        </div>
      )}
    </div>
  );
}
