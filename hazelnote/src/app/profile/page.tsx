'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  UserCircle,
  HelpCircle,
  Menu,
  X,
  Activity,
  Settings,
  CreditCard,
  AlertTriangle,
  LogOut,
  Trash2,
} from 'lucide-react';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeParseJSON, getCurrentMonth } from '@/lib/utils';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState<any>({ streak: 0, notes: 0, monthlySets: {} });
  const [tier, setTier] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const p = snap.data();
          setProfile(p);
          setTier(p.is_pro ? 'pro' : 'free');
        }
      }
    });

    setStats(safeParseJSON('hz_stats', { streak: 0, notes: 0, monthlySets: {} }));
    setDarkMode(document.documentElement.classList.contains('dark'));

    return () => unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('hz_dark_mode', String(newDarkMode));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login/');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your account? All your study sets will be lost. This cannot be undone.')) {
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
          router.push('/');
        } catch (e: any) {
          if (e.code === 'auth/requires-recent-login') {
            alert('For security, please log out and log back in before deleting your account.');
          } else {
            alert('Error deleting account: ' + e.message);
          }
        }
      }
    }
  };

  const month = getCurrentMonth();
  const monthlyCount = stats.monthlySets?.[month] || 0;
  const usagePercentage = tier === 'free' ? Math.min((monthlyCount / 2) * 100, 100) : 100;

  // Sidebar component
  const Sidebar = () => (
    <aside className={`w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full z-50 fixed md:sticky top-0 left-0 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white leading-none">HazelNote</h1>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">by free-ed</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition dark:text-gray-400 dark:hover:bg-gray-800">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link href="/dashboard/#create" className="w-full text-left sidebar-item flex items-center gap-3">
          <PlusCircle className="w-5 h-5" /> Create Notes
        </Link>
        <Link href="/exam/" className="w-full text-left sidebar-item flex items-center gap-3">
          <ClipboardList className="w-5 h-5" /> Take an Exam
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {tier === 'free' && (
          <div className="mb-2">
            <Link href="/pricing/" className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">
              ⚡ Upgrade to Pro
            </Link>
          </div>
        )}
        <Link href="/profile/" className="w-full text-left sidebar-item active flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <UserCircle className="w-5 h-5" /> Profile & Settings
        </Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <HelpCircle className="w-5 h-5" /> Support
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />
      )}

      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto pb-12 relative">
        {/* Desktop hamburger menu button */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>

        {/* Mobile header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-lg text-gray-900 dark:text-white">HazelNote</span>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
          <header className="mb-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
              {user?.displayName?.[0] || user?.email?.[0] || 'H'}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{user?.displayName || 'My Profile'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wider border border-green-200">
                  {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            {/* Usage Statistics */}
            {tier === 'free' && (
              <div className="glass-card p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Usage Statistics
                </h3>
                <div className="mb-2 flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                  <span>Monthly Generation Sets Used</span>
                  <span>{monthlyCount} / 2</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                  <div className={`h-3 rounded-full transition-all duration-700 ${usagePercentage >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${usagePercentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-500">Free tier allows 2 generated study sets per month.</p>
              </div>
            )}

            {/* Settings */}
            <div className="glass-card p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" /> App Settings
              </h3>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Dark Mode</h4>
                  <p className="text-xs text-gray-500">Toggle dark theme across the workspace</p>
                </div>
                <button id="dark-mode-toggle" onClick={toggleDarkMode}>
                  <span id="dark-mode-thumb"></span>
                </button>
              </div>
            </div>

            {/* Billing */}
            <section className="glass-card p-6 border border-green-100 dark:border-green-800 dark:bg-gray-800">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" /> Subscription & Billing
              </h3>
              <div>
                <Link href="/pricing/" className="btn-primary px-6 py-3 inline-block rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">
                  View Pricing Plans
                </Link>
              </div>
            </section>

            {/* Danger Zone */}
            <div className="glass-card p-6 border border-red-100 bg-red-50/10 dark:bg-gray-800 dark:border-red-900">
              <h3 className="text-xl font-bold mb-4 border-b border-red-100 dark:border-red-900 pb-2 text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleLogout} className="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-3 px-6 rounded-xl font-bold w-full sm:w-auto text-left flex justify-center items-center gap-2 transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button onClick={handleDeleteAccount} className="bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 py-3 px-6 rounded-xl font-bold transition w-full sm:w-auto text-left flex justify-center items-center gap-2 dark:bg-red-900/20 dark:border-red-800">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
