"use client";
import { useState } from 'react';
import { Activity, Settings, CreditCard, AlertTriangle, LogOut, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <header className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">U</div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">My Profile</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wider border border-green-200">Free Plan</span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Usage Stats */}
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Usage Statistics</h3>
          <div className="mb-2 flex justify-between text-sm font-bold text-gray-700">
            <span>Monthly Generation Sets Used</span>
            <span>0 / 3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: '0%' }}></div>
          </div>
          <p className="text-xs text-gray-500">Free tier allows up to 3 generated study sets per month.</p>
        </div>

        {/* Settings */}
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> App Settings</h3>
          <div className="flex items-center justify-between py-2">
            <div>
                <h4 className="font-bold text-gray-900">Dark Mode</h4>
                <p className="text-xs text-gray-500">Toggle dark theme across the workspace</p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full relative transition duration-300 flex-shrink-0 cursor-pointer shadow-inner ${darkMode ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-md ${darkMode ? 'left-7' : 'left-1'}`}></span>
            </button>
          </div>
        </div>

        {/* Billing */}
        <section className="bg-white rounded-[24px] shadow-sm p-6 border border-green-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-500" /> Subscription & Billing</h3>
          <a href="/pricing" className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 inline-block rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">View Pricing Plans</a>
        </section>

        {/* Danger Zone */}
        <div className="bg-red-50/10 rounded-[24px] shadow-sm p-6 border border-red-100">
          <h3 className="text-xl font-bold mb-4 border-b border-red-100 pb-2 text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 transition">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <button className="bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 py-3 px-6 rounded-xl font-bold transition flex justify-center items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}