"use client";
import { useState } from 'react';
import { Flame, FileCheck2, Sparkles, FileUp, Mic, Youtube, FileText, Download, Wand2, Brain } from 'lucide-react';

export default function DashboardPage() {
  // Using React State for UI toggles instead of Vanilla JS
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'create'
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf', 'voice', 'youtube'
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerGenerate = () => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setActiveView('dashboard');
      alert("Notes Generated! (Backend logic will be wired here)");
    }, 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pt-8 md:pt-12">
      
      {/* View: DASHBOARD */}
      {activeView === 'dashboard' && (
        <div className="animate-slide-in">
          <header className="mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome back! 👋</h2>
            <p className="text-gray-500 text-lg">Track your progress and continue learning.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-6 flex items-center gap-5 transition hover:shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600"><Flame className="w-7 h-7" /></div>
              <div><p className="text-sm text-gray-500 font-medium">Study Streak</p><p className="text-3xl font-extrabold text-gray-900">0 <span className="text-lg text-gray-400 font-medium">Days</span></p></div>
            </div>
            <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-6 flex items-center gap-5 transition hover:shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600"><FileCheck2 className="w-7 h-7" /></div>
              <div><p className="text-sm text-gray-500 font-medium">Notes Generated</p><p className="text-3xl font-extrabold text-gray-900">0</p></div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500"><Sparkles className="w-10 h-10" /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to learn something new?</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Upload PDFs, dictate voice notes, or paste YouTube URLs to generate your next study set.</p>
            <button onClick={() => setActiveView('create')} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-10 py-4 text-lg shadow-xl shadow-green-200 transition">Create New Study Set</button>
          </div>

          <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Recent Study Sets</h3>
            </div>
            <div className="space-y-4">
                <p className="text-gray-400 text-center py-8">No study sets yet. Create your first one!</p>
            </div>
          </div>
        </div>
      )}

      {/* View: CREATE NOTES */}
      {activeView === 'create' && (
        <div className="max-w-4xl mx-auto animate-slide-in">
          <div className="mb-6">
             <button onClick={() => setActiveView('dashboard')} className="text-gray-500 hover:text-gray-900 transition text-sm font-bold flex items-center gap-2">← Back to Dashboard</button>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">What are we studying today?</h2>
          
          {!isGenerating ? (
            <div>
              {/* Mode Selector */}
              <div className="bg-white p-2 rounded-[32px] flex flex-col md:flex-row gap-2 mb-10 mx-auto max-w-2xl shadow-xl shadow-gray-100 border border-gray-100">
                <button onClick={() => setInputMode('pdf')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'pdf' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><FileUp className="w-4 h-4" /> PDF Upload</button>
                <button onClick={() => setInputMode('voice')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'voice' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Mic className="w-4 h-4" /> Voice Record</button>
                <button onClick={() => setInputMode('youtube')} className={`flex-1 py-4 px-6 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${inputMode === 'youtube' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Youtube className="w-4 h-4" /> YouTube</button>
              </div>

              {/* Dynamic Inputs */}
              {inputMode === 'pdf' && (
                <div className="bg-white rounded-[24px] p-8 md:p-12 text-center border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Upload Multiple PDFs</h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Upload documents to be instantly processed via Gemini AI.</p>
                  <label className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-10 py-4 cursor-pointer inline-block shadow-lg text-lg transition">
                    Browse Files <input type="file" multiple accept=".pdf" className="hidden" />
                  </label>
                </div>
              )}

              {inputMode === 'voice' && (
                <div className="bg-white rounded-[24px] p-8 md:p-12 text-center shadow-sm border border-gray-100">
                  <textarea className="w-full h-40 p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-50 text-base" placeholder="Type or dictate your notes..."></textarea>
                  <button className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-6 py-3 flex items-center justify-center gap-2 mx-auto mt-6 transition-all duration-300">
                     <Mic className="w-4 h-4" /> Start Dictation
                  </button>
                </div>
              )}

              {inputMode === 'youtube' && (
                <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input type="text" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 bg-gray-50 text-sm font-medium" placeholder="Paste YouTube URL here..." />
                    <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Fetch</button>
                  </div>
                  <textarea className="w-full h-48 p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 bg-gray-50 text-sm font-mono" placeholder="Transcript will appear here..."></textarea>
                </div>
              )}

              <div className="mt-10 text-center">
                <button onClick={triggerGenerate} className="bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full px-10 md:px-16 py-4 md:py-5 text-lg md:text-xl shadow-xl shadow-green-200 w-full md:w-auto flex items-center justify-center gap-3 mx-auto transition">
                  <Wand2 className="w-6 h-6" /> Generate Study Set
                </button>
              </div>
            </div>
          ) : (
            // Loading State
            <div className="max-w-2xl mx-auto mt-10 text-center bg-white rounded-[24px] border border-gray-100 p-8 md:p-12 relative overflow-hidden shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Brain className="w-8 h-8 text-green-600 animate-pulse" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Synthesizing Knowledge...</h3>
              <p className="text-sm font-medium text-gray-500 animate-pulse">Processing with AI models...</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}