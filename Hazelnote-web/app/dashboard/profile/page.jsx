"use client";
import { Activity, Settings, CreditCard, AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

export default function ProfilePage() {
  const { isDarkMode, setIsDarkMode, generationsToday, tier } = useAppContext();

  // Mathematically ensures it shows 0% if no generations are used
  const progressPercentage = generationsToday === 0 ? 0 : Math.min(100, (generationsToday / 1) * 100);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <header className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">U</div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Profile</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">Free Plan</span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[24px] shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2 dark:text-white"><Activity className="w-5 h-5 text-blue-500" /> Usage Statistics</h3>
          <div className="mb-2 flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
            <span>Daily Generations Used</span>
            <span>{generationsToday} / {tier === 'free' ? '1' : 'Unlimited'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: tier === 'free' ? `${progressPercentage}%` : '100%' }}></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Free tier allows 1 generated study set per day.</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[24px] shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2 dark:text-white"><Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" /> App Settings</h3>
          <div className="flex items-center justify-between py-2">
            <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme across the workspace</p>
            </div>
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <section className="bg-white dark:bg-[#1E293B] rounded-[24px] shadow-sm p-6 border border-emerald-100 dark:border-slate-800">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" /> Subscription & Billing</h3>
          <a href="/pricing" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 inline-block rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">View Pricing Plans</a>
        </section>

        <div className="bg-red-50/50 dark:bg-red-900/10 rounded-[24px] shadow-sm p-6 border border-red-100 dark:border-red-900/30">
          <h3 className="text-xl font-bold mb-4 border-b border-red-100 dark:border-red-900/30 pb-2 text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 transition">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <button className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 py-3 px-6 rounded-xl font-bold transition flex justify-center items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
