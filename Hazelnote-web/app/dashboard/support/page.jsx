"use client";
import { Mail, MessageCircle } from 'lucide-react';
// Exact relative path (3 levels deep)
import { useAppContext } from '../../../context/AppContext';

export default function SupportPage() {
  const { tier } = useAppContext();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Help & Support</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Get help with your account or report an issue.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] p-6 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">We aim to respond to all queries within 24 hours.</p>
          <button className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-bold transition">Contact Support</button>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
          {tier !== 'max' && (
              <div className="absolute top-4 right-4 text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-bold">Max Tier</div>
          )}
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Priority Live Chat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Instant access to our support team for Max users.</p>
          <button className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tier === 'max' ? 'bg-[#10B981] hover:bg-[#059669] text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'}`}>
            {tier === 'max' ? 'Start Chat' : 'Upgrade to Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
