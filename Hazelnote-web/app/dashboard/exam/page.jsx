"use client";
import { useState } from 'react';
import { Search, List } from 'lucide-react';
// Exact relative path (3 levels deep)
import { useAppContext } from '../../../context/AppContext';

export default function ExamPage() {
  const [board, setBoard] = useState('general');
  const [qType, setQType] = useState('mcq');
  const [qCount, setQCount] = useState(5);
  const { tier } = useAppContext();

  const handleGenerate = () => {
    // Enforce tier restrictions for question counts
    if (qCount >= 20 && tier === 'free') {
        alert(`Generating ${qCount} questions requires a Pro or Max subscription.`);
        return;
    }
    alert("Generating Exam...");
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Take an Exam</h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Generate a customised exam based on your notes.</p>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-purple-500" /> Board / Curriculum</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {['general', 'caie', 'edexcel', 'aqa', 'ib', 'sat', 'fbise'].map((b) => (
              <button key={b} onClick={() => setBoard(b)} className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition ${board === b ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700'}`}>
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] shadow-sm p-5">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
            <select className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-slate-900 font-medium outline-none dark:text-white">
              <option value="easy">Easy — Foundation</option>
              <option value="medium">Medium — Standard</option>
              <option value="hard">Hard — Advanced</option>
            </select>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] shadow-sm p-5">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time Limit</label>
            <select className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-slate-900 font-medium outline-none dark:text-white">
              <option value="0">No time limit</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] shadow-sm p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><List className="w-5 h-5 text-blue-500" /> Question Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => setQType('mcq')} className={`p-4 rounded-2xl border-2 text-left transition ${qType === 'mcq' ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
              <div className="font-bold text-gray-700 dark:text-gray-200 mb-1">MCQ</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Multiple choice</div>
            </button>
            <button onClick={() => setQType('structured')} className={`p-4 rounded-2xl border-2 text-left transition ${qType === 'structured' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
              <div className="font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">Structured <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Pro</span></div>
            </button>
            <button onClick={() => setQType('essay')} className={`p-4 rounded-2xl border-2 text-left transition ${qType === 'essay' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
              <div className="font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">Essay <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">Max</span></div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] shadow-sm p-5">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Number of Questions</label>
            <div className="flex gap-4 flex-wrap">
                {[5, 10, 20, 30].map((count) => (
                    <button key={count} onClick={() => setQCount(count)} className={`relative px-6 py-3 rounded-xl border-2 font-bold text-sm transition ${qCount === count ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                        {count} Questions
                        {count === 20 && <span className="absolute -top-2.5 -right-2 text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-orange-200">Pro</span>}
                        {count === 30 && <span className="absolute -top-2.5 -right-2 text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-purple-200">Max</span>}
                    </button>
                ))}
            </div>
        </div>

        <button onClick={handleGenerate} className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-full font-bold transition py-4 text-lg shadow-xl shadow-green-200 dark:shadow-none">Generate Exam</button>
      </div>
    </div>
  );
}
