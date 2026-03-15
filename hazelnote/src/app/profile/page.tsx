'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, ClipboardList, UserCircle, HelpCircle,
  Menu, X, Activity, Settings, CreditCard, AlertTriangle, LogOut, Trash2, KeyRound, Eye, EyeOff, Loader2, Bot,
} from 'lucide-react';
import {
  onAuthStateChanged, signOut, deleteUser,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { safeParseJSON, getCurrentMonth } from '@/lib/utils';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>({ streak: 0, notes: 0, monthlySets: {} });
  const [tier, setTier] = useState<'free' | 'pro'>('free');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);

  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const isEmail = u.providerData?.some((p: any) => p.providerId === 'password');
        setIsEmailUser(!!isEmail);
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const p = snap.data();
          setProfile(p);
          setTier(p.is_pro && !p.fs_is_cancelled ? 'pro' : 'free');
          if (p.stats) setStats(p.stats);
        }
      }
    });
    setStats(safeParseJSON('hz_stats', { streak: 0, notes: 0, monthlySets: {} }));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('hz_study_history');
    localStorage.removeItem('hz_stats');
    localStorage.removeItem('hz_folders');
    localStorage.removeItem('hz_prof_chats');
    if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase('HazelNoteDB');
    await signOut(auth);
    router.push('/login/');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your account? All your study sets will be lost. This cannot be undone.')) {
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
          localStorage.removeItem('hz_study_history');
          localStorage.removeItem('hz_stats');
          localStorage.removeItem('hz_folders');
          localStorage.removeItem('hz_prof_chats');
          if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase('HazelNoteDB');
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

  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPassword) { setPwStatus('Please enter your current password.'); return; }
    if (newPassword.length < 8) { setPwStatus('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwStatus('New passwords do not match.'); return; }
    setPwLoading(true);
    setPwStatus('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwStatus('✅ Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPwStatus('❌ Current password is incorrect.');
      } else {
        setPwStatus('❌ Error: ' + (e.message || 'Failed to change password.'));
      }
    }
    setPwLoading(false);
  };

  const handleManageBilling = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/freemius/portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(data.error || "Could not load billing portal. Please contact support.");
      }
    } catch (e) {
      alert("Error connecting to billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm("To cancel your subscription, please log into your billing portal. Do you want to proceed?")) {
      await handleManageBilling();
    }
  };

  const month = getCurrentMonth();
  const monthlyCount = stats.monthlySets?.[month] || 0;
  const usagePercentage = tier === 'free' ? Math.min((monthlyCount / 2) * 100, 100) : 100;

  // FIX 4: Sidebar dark-only
  const Sidebar = () => (
    <aside className={`w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-50 fixed md:sticky top-0 left-0 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img src="/hazelnote_logo.png" alt="HazelNote Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-xl tracking-tight text-white leading-none">HazelNote</h1>
            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">by free-ed</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition"><X className="w-5 h-5" /></button>
      </div>
      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard/" className="w-full text-left sidebar-item flex items-center gap-3"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
        <Link href="/dashboard/#create" className="w-full text-left sidebar-item flex items-center gap-3"><PlusCircle className="w-5 h-5" /> Create Notes</Link>
        <Link href="/exam/" className="w-full text-left sidebar-item flex items-center gap-3"><ClipboardList className="w-5 h-5" /> Take an Exam</Link>
        <Link href="/professor/" className="w-full text-left sidebar-item flex items-center gap-3"><Bot className="w-5 h-5" /> Professor Hazel</Link>
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-1">
        {tier === 'free' && <div className="mb-2"><Link href="/pricing/" className="w-full go-pro-badge py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm">⚡ Upgrade to Pro</Link></div>}
        <Link href="/profile/" className="w-full text-left sidebar-item active flex items-center gap-3 font-medium text-gray-400 hover:text-white"><UserCircle className="w-5 h-5" /> Profile & Settings</Link>
        <Link href="/support/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-400 hover:text-white"><HelpCircle className="w-5 h-5" /> Support</Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" />}
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto pb-12 relative bg-slate-900">
        <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition items-center gap-2">
          <Menu className="w-5 h-5" /><span className="text-sm font-medium">Menu</span>
        </button>
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2">
            <img src="/hazelnote_logo.png" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-lg text-white">HazelNote</span>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
          <header className="mb-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
              {user?.displayName?.[0] || user?.email?.[0] || 'H'}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white">{user?.displayName || 'My Profile'}</h2>
              {user?.uid && <div className="text-xs text-gray-500 mt-1 font-mono tracking-wide">ID: {user.uid}</div>}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${tier === 'pro' ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                  {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
                {profile?.fs_is_cancelled && tier === 'pro' && (
                  <span className="text-xs font-bold bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full uppercase tracking-wider border border-yellow-700">
                    Cancels Soon
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="space-y-6">
            {tier === 'free' && (
              <div className="glass-card p-6 mb-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-blue-400" /> Usage Statistics
                </h3>
                <div className="mb-2 flex justify-between text-sm font-bold text-gray-300">
                  <span>Monthly Generation Sets Used</span>
                  <span>{monthlyCount} / 2</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                  <div className={`h-3 rounded-full transition-all duration-700 ${usagePercentage >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${usagePercentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-500">Free tier allows 2 generated study sets per month.</p>
              </div>
            )}

            {isEmailUser && (
              <div className="glass-card p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2 text-white">
                  <KeyRound className="w-5 h-5 text-yellow-500" /> Change Password
                </h3>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 pr-10" />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                    <div className="relative">
                      <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 pr-10" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
                  </div>
                  {pwStatus && (
                    <p className={`text-sm font-medium ${pwStatus.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{pwStatus}</p>
                  )}
                  <button onClick={handleChangePassword} disabled={pwLoading}
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {pwLoading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>Updating...</> : <><KeyRound className="w-4 h-4" />Update Password</>}
                  </button>
                </div>
              </div>
            )}

            <section className="glass-card p-6 bg-gray-800/50 border-gray-700">
              <h3 className="text-xl font-extrabold text-white mb-4 text-left flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" /> Subscription & Billing
              </h3>
              {tier === 'pro' ? (
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Plan Type</span>
                      <span className="font-extrabold text-white capitalize">{profile?.fs_plan_type || 'Monthly'} Pro</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                        {profile?.fs_is_cancelled ? 'Expires On' : 'Renewal Date'}
                      </span>
                      <span className="font-extrabold text-white">
                        {profile?.fs_renewal_date ? new Date(profile.fs_renewal_date).toLocaleDateString() : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleManageBilling} disabled={portalLoading}
                      className="btn-primary flex-1 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition text-center flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
                      {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      {portalLoading ? 'Securing Link...' : 'Manage Billing'}
                    </button>
                    {!profile?.fs_is_cancelled && (
                      <button onClick={handleCancelSubscription} disabled={portalLoading}
                        className="bg-gray-700 hover:bg-red-900/40 text-gray-200 hover:text-red-400 flex-1 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition text-center flex items-center justify-center gap-2 border border-gray-600 hover:border-red-800 disabled:opacity-50">
                        <X className="w-4 h-4" /> Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Link href="/pricing/" className="btn-primary px-6 py-3 inline-block rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">
                    View Pricing Plans
                  </Link>
                </div>
              )}
            </section>

            <div className="glass-card p-6 border border-red-900/50 bg-gray-800/50">
              <h3 className="text-xl font-bold mb-4 border-b border-red-900/50 pb-2 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleLogout} className="bg-gray-700 border-2 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 py-3 px-6 rounded-xl font-bold w-full sm:w-auto text-left flex justify-center items-center gap-2 transition">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button onClick={handleDeleteAccount} className="bg-red-900/20 text-red-400 hover:bg-red-900/40 border-2 border-red-900/50 py-3 px-6 rounded-xl font-bold transition w-full sm:w-auto text-left flex justify-center items-center gap-2">
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
