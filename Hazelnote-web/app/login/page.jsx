"use client";
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
  const router = useRouter();

  const showAlert = (msg, type) => setAlert({ show: true, msg, type });

  const handleSignIn = (e) => {
    e.preventDefault();
    showAlert("Email auth is currently disabled, please use Google Login.", "error");
  };

  const handleGoogleSignIn = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // Safely redirect using Next.js router
        router.push('/dashboard');
    } catch (error) {
        showAlert(error.message, "error");
    }
  };

  return (
    <div className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="fixed rounded-full filter blur-[90px] opacity-12 pointer-events-none w-80 h-80 bg-emerald-500 -top-[8%] -left-[8%]"></div>
      <div className="fixed rounded-full filter blur-[90px] opacity-12 pointer-events-none w-64 h-64 bg-blue-600 -bottom-[5%] -right-[5%]"></div>

      <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-sm p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/hazelnote_logo.png" alt="HazelNote" className="w-11 h-8 object-fill rounded-md" />
            <span className="text-2xl font-extrabold tracking-tight">HazelNote</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">by free-ed · AI Study Workspace</div>
        </div>

        {activeTab !== 'reset' && (
          <div className="flex bg-slate-900/50 rounded-xl p-1 mb-5 border border-white/5">
            <button onClick={() => setActiveTab('in')} className={`flex-1 p-2 rounded-lg font-semibold text-sm transition ${activeTab === 'in' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}>Sign In</button>
            <button onClick={() => setActiveTab('up')} className={`flex-1 p-2 rounded-lg font-semibold text-sm transition ${activeTab === 'up' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}>Sign Up</button>
          </div>
        )}

        {alert.show && (
          <div className={`p-3 rounded-xl text-sm font-medium mb-4 border ${alert.type === 'ok' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'}`}>
            {alert.msg}
          </div>
        )}

        <button type="button" onClick={handleGoogleSignIn} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition mb-4">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          {activeTab === 'up' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900/70 border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition" placeholder="Alex Johnson" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/70 border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition" placeholder="you@example.com" />
          </div>

          {activeTab !== 'reset' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {activeTab === 'in' && <button type="button" onClick={() => setActiveTab('reset')} className="text-xs font-bold text-emerald-500 hover:text-emerald-400">Forgot?</button>}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/70 border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition" placeholder="••••••••" />
            </div>
          )}

          <button type="submit" className="w-full p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition">
            {activeTab === 'in' ? 'Sign In' : activeTab === 'up' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        {activeTab === 'reset' && (
          <div className="text-center mt-4">
            <button onClick={() => setActiveTab('in')} className="text-sm font-semibold text-emerald-500 hover:text-emerald-400">← Back to Sign In</button>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/dashboard" className="text-xs text-slate-400 hover:text-slate-300 transition">Continue without account →</a>
        </div>
      </div>
    </div>
  );
}
