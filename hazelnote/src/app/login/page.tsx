'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'in' | 'up' | 'reset'>('in');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'err' | 'ok' } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const showAlert = (msg: string, type: 'err' | 'ok') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const createUserProfile = async (user: any, displayName?: string) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    await setDoc(doc(db, 'profiles', user.uid), {
      full_name: displayName || user.displayName || '',
      email: user.email || '',
      tier: 'free',
      is_pro: false,
      created_at: serverTimestamp(),
      monthly_sets: { [currentMonth]: 0 },
      total_sets_created: 0,
      last_active: serverTimestamp(),
    });
  };

  // Helper to completely purge any previous account data to avoid leaks
  const clearLocalData = () => {
    localStorage.removeItem('hz_study_history');
    localStorage.removeItem('hz_stats');
    localStorage.removeItem('hz_folders');
    localStorage.removeItem('hz_prof_chats');
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('HazelNoteDB');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearLocalData(); // Wipe cache before proceeding with authentication
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profileRef = doc(db, 'profiles', user.uid);
      const snap = await getDoc(profileRef);
      if (!snap.exists()) {
        await createUserProfile(user);
      }
      
      showAlert('Signed in! Redirecting...', 'ok');
      setTimeout(() => router.push('/dashboard/'), 900);
    } catch (e: any) {
      showAlert(e.message || 'Google sign-in failed', 'err');
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showAlert('Please fill all fields.', 'err');
      return;
    }
    setLoading(true);
    clearLocalData(); // Wipe cache before proceeding with authentication
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert('Signed in! Redirecting...', 'ok');
      setTimeout(() => router.push('/dashboard/'), 900);
    } catch (e: any) {
      showAlert(e.message || 'Sign in failed', 'err');
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      showAlert('Please fill all fields.', 'err');
      return;
    }
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters.', 'err');
      return;
    }
    setLoading(true);
    clearLocalData(); // Wipe cache before proceeding with authentication
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(cred.user, name);
      showAlert('Account created! Redirecting...', 'ok');
      setTimeout(() => router.push('/dashboard/'), 1200);
    } catch (e: any) {
      showAlert(e.message || 'Sign up failed', 'err');
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetEmail) {
      showAlert('Please enter your email.', 'err');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showAlert('Reset link sent! Check your inbox.', 'ok');
    } catch (e: any) {
      showAlert(e.message || 'Reset failed', 'err');
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed w-80 h-80 bg-green-500 rounded-full filter blur-[90px] opacity-[0.12] pointer-events-none" style={{ top: '-8%', left: '-8%' }}></div>
      <div className="fixed w-64 h-64 bg-blue-600 rounded-full filter blur-[90px] opacity-[0.12] pointer-events-none" style={{ bottom: '-5%', right: '-5%' }}></div>

      <div className="bg-[rgba(30,41,59,0.88)] backdrop-blur-[24px] border border-white/[0.07] rounded-[24px] w-full max-w-[360px] p-[30px_26px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <img src="/hazelnote_logo.png" alt="HazelNote" className="w-[46px] h-8 object-fill rounded-md" />
            <span className="text-[1.3rem] font-extrabold text-[#F1F5F9] tracking-[-0.02em]">HazelNote</span>
          </div>
          <div className="text-[0.73rem] text-[#475569] mt-0.5">by free-ed · AI Study Workspace</div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[rgba(15,23,42,0.5)] rounded-lg p-1 mb-4 border border-white/[0.05]">
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-[0.8rem] transition-all ${
              activeTab === 'in' ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]' : 'text-[#64748B]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('up')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-[0.8rem] transition-all ${
              activeTab === 'up' ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]' : 'text-[#64748B]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`p-2.5 rounded-lg text-[0.8rem] font-medium mb-3 ${
            alert.type === 'ok' 
              ? 'bg-[rgba(16,185,129,0.13)] text-[#6EE7B7] border border-[rgba(16,185,129,0.25)]' 
              : 'bg-[rgba(239,68,68,0.13)] text-[#FCA5A5] border border-[rgba(239,68,68,0.25)]'
          }`}>
            {alert.msg}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-[rgba(255,255,255,0.06)] text-[#E2E8F0] font-semibold text-[0.875rem] rounded-[11px] border border-white/[0.12] flex items-center justify-center gap-2 transition-all hover:bg-[rgba(255,255,255,0.1)] hover:border-white/[0.2]"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-2.5 my-3.5">
          <div className="flex-1 h-px bg-white/[0.08]"></div>
          <span className="text-[0.7rem] text-[#334155] font-semibold uppercase tracking-[0.06em]">or</span>
          <div className="flex-1 h-px bg-white/[0.08]"></div>
        </div>

        {/* Sign In Form */}
        {activeTab === 'in' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                onFocus={handleInputFocus}
                placeholder="you@example.com"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em]">Password</label>
                <button onClick={() => setActiveTab('reset')} className="bg-none border-none text-[#10B981] text-[0.75rem] font-semibold cursor-pointer hover:text-[#34D399]">Forgot?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                onFocus={handleInputFocus}
                placeholder="••••••••"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-[0.875rem] rounded-[11px] border-none cursor-pointer transition-all shadow-[0_4px_14px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 hover:translate-y-[-1px] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              Sign In
            </button>
          </div>
        )}

        {/* Sign Up Form */}
        {activeTab === 'up' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Alex Johnson"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="you@example.com"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                onFocus={handleInputFocus}
                placeholder="At least 8 characters"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-[0.875rem] rounded-[11px] border-none cursor-pointer transition-all shadow-[0_4px_14px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 hover:translate-y-[-1px] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              Create Account
            </button>
          </div>
        )}

        {/* Reset Form */}
        {activeTab === 'reset' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] rounded-lg p-2.5 text-[0.78rem] text-[#93C5FD]">
              Enter your email and we&apos;ll send a reset link.
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold text-[#64748B] uppercase tracking-[0.07em] mb-1">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="you@example.com"
                className="w-full bg-[rgba(15,23,42,0.7)] border border-white/[0.09] rounded-[11px] py-2.5 px-3 text-[#E2E8F0] text-[0.875rem] transition-all outline-none focus:border-[#10B981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] placeholder:text-[#374151]"
              />
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-gradient-to-br from-[#10B981] to-[#059669] text-white font-bold text-[0.875rem] rounded-[11px] border-none cursor-pointer transition-all shadow-[0_4px_14px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 hover:translate-y-[-1px] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)]"
            >
              Send Reset Link
            </button>
            <button onClick={() => setActiveTab('in')} className="bg-none border-none text-[#10B981] text-[0.75rem] font-semibold cursor-pointer hover:text-[#34D399] text-center py-1">
              ← Back to Sign In
            </button>
          </div>
        )}

        <div className="text-center mt-3.5">
          <Link href="/dashboard/" className="text-[#374151] text-[0.71rem] no-underline hover:text-[#10B981]">
            Continue without account →
          </Link>
        </div>
      </div>
    </div>
  );
}
