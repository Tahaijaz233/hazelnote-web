"use client";
import { useState } from 'react';
import { Mic, FileUp, Youtube, Download, Brain, FileText } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

export default function CreatePage() {
  const [inputMode, setInputMode] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  const { generationsToday, setGenerationsToday, tier } = useAppContext();

  const showToast = (msg, type = 'error') => {
      setToast({ show: true, msg, type });
      setTimeout(() => setToast({ show: false, msg: '', type: '' }), 4000);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        triggerGenerate();
    }
  };

  const triggerGenerate = () => {
    if (tier === 'free' && generationsToday >= 1) {
        showToast("Free tier daily limit reached (1/1). Upgrade to Pro for unlimited generation.");
        return;
    }
    
    setIsGenerating(true);
    setToast({ show: false, msg: '', type: '' });
    
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationsToday(prev => prev + 1);
      showToast("Notes Generated Successfully! Check your Dashboard.", "success");
    }, 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto pt-8 md:pt-16 relative">
      
      {toast.show && (
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-xl font-bold text-center shadow-xl z-50 animate-slide-in ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {toast.msg}
          </div>
      )}

      {!isGenerating ? (
        <div className="animate-slide-in">
          <div className="text-center mb-10 mt-6">
             <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Create New <span className="text-[#10B981]">Study Set</span></h1>
             <p className="text-gray-500 dark:text-gray-400">Upload your material to generate notes, flashcards, and quizzes.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#1E293B] p-2 rounded-[32px] flex flex-col sm:flex-row gap-2 mb-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <button onClick={() => setInputMode('pdf')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'pdf' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}><FileText className="w-4 h-4" /> PDF Upload</button>
              <button onClick={() => setInputMode('voice')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'voice' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}><Mic className="w-4 h-4" /> Voice Record</button>
              <button onClick={() => setInputMode('youtube')} className={`flex-1 py-3.5 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'youtube' ? 'bg-[#10B981] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}><Youtube className="w-4 h-4" /> YouTube</button>
            </div>

            {inputMode === 'pdf' && (
              <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-12 text-center shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileUp className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload a pdf</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">We'll automatically extract the text and structure it for you.</p>
                <label className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-10 py-4 cursor-pointer inline-block shadow-lg shadow-emerald-200 dark:shadow-none text-lg transition">
                  Upload a pdf <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {inputMode === 'voice' && (
              <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 text-center">
                <textarea className="w-full h-40 p-5 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-[#10B981] bg-gray-50 dark:bg-[#0F172A] text-base resize-none text-gray-900 dark:text-white" placeholder="Type or dictate your lecture notes..."></textarea>
                <button onClick={triggerGenerate} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-8 py-4 flex items-center justify-center gap-2 mx-auto mt-6 transition-all shadow-lg">
                   <Mic className="w-5 h-5" /> Start Dictation
                </button>
              </div>
            )}

            {inputMode === 'youtube' && (
              <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row gap-3 mb-2">
                  <input type="text" className="flex-1 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#10B981] bg-gray-50 dark:bg-[#0F172A] text-base font-medium text-gray-900 dark:text-white" placeholder="Paste YouTube URL here..." />
                  <button onClick={triggerGenerate} className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg"><Download className="w-5 h-5" /> Fetch</button>
                </div>
              </div>
            )}

            <div className="text-center mt-6">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {generationsToday} / {tier === 'free' ? '1' : 'Unlimited'} Daily Sets Used
                </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto mt-16 text-center bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-slate-800 p-12 relative overflow-hidden shadow-xl">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Brain className="w-10 h-10 text-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Synthesizing Knowledge...</h3>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 animate-pulse">Reading content and generating study materials.</p>
        </div>
      )}
    </div>
  );
}
