'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

declare global {
  interface Window {
    FS: any;
    jQuery: any;
    $: any;
  }
}

export default function Pricing() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [fsLoaded, setFsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setIsLoggedIn(!!u);
      setUser(u);
      if (u) {
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists() && snap.data().is_pro) {
          setIsPro(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const openCheckout = () => {
    if (!user) {
      alert("Please log in or create an account to upgrade to Pro.");
      router.push('/login');
      return;
    }

    if (!fsLoaded || !window.FS || !window.FS.Checkout) {
      alert("Checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);

    try {
      const handler = window.FS.Checkout.configure({
        plugin_id: process.env.NEXT_PUBLIC_FREEMIUS_PRODUCT_ID,
        public_key: process.env.NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY,
        image: '/hazelnote_logo.png',
      });

      handler.open({
        name: 'HazelNote Pro',
        plan_id: process.env.NEXT_PUBLIC_FREEMIUS_PLAN_ID,
        billing_cycle: billing,
        user_email: user.email,
        success: function (response: any) {
          alert("Payment successful! Welcome to HazelNote Pro.");
          router.push('/dashboard');
        }
      });
    } catch (err) {
      console.error("Freemius Checkout Error:", err);
      alert("Failed to load checkout. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const proPrice = billing === 'annual' ? '$4.25' : '$5';
  const proPeriod = billing === 'annual' ? '/mo (billed annually)' : '/mo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      {/* FIX: Load jQuery first via onLoad, then dynamically inject Freemius checkout.
          This ensures jQuery is available before Freemius tries to use it. */}
      <Script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          const script = document.createElement('script');
          script.src = 'https://checkout.freemius.com/checkout.min.js';
          script.onload = () => setFsLoaded(true);
          script.onerror = () => console.error('Failed to load Freemius checkout script');
          document.body.appendChild(script);
        }}
      />

      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-[#0F172A]/70 backdrop-blur-xl border border-gray-800 rounded-full shadow-2xl">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
              <img src="/hazelnote_logo.png" alt="HazelNote" className="w-10 h-7 object-fill rounded-lg" />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-extrabold text-white leading-none">HazelNote</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">by free-ed</span>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-gray-300 hover:text-white font-bold transition text-sm">Home</Link>
                <Link href="/pricing/" className="text-white font-medium transition text-sm">Pricing</Link>
                {!isLoggedIn && (
                  <Link href="/login/" className="text-gray-300 hover:text-white font-medium transition text-sm">Sign In</Link>
                )}
              </div>
              <Link
                href={isLoggedIn ? "/dashboard/" : "/login/"}
                className="px-6 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full transition shadow-lg text-sm"
              >
                {isLoggedIn ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Simple, Transparent <span className="text-green-400">Pricing</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Start for free. Upgrade when you need more power.
          </p>

          <div className="inline-flex items-center gap-2 mt-8 bg-gray-800 border border-gray-700 rounded-full p-1.5">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition ${billing === 'monthly' ? 'bg-green-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition ${billing === 'annual' ? 'bg-green-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Annual <span className="ml-1 text-green-400 text-xs font-bold">Save 15%</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Free</h3>
              <p className="text-gray-400 text-sm">Perfect for getting started</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">$0</span>
              <span className="text-gray-400 text-lg ml-2">/forever</span>
            </div>
            <Link
              href={isLoggedIn ? "/dashboard/" : "/login/"}
              className="block w-full py-3 px-6 text-center bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl mb-8 transition border border-gray-600"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
            </Link>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-400 mt-0.5" /><span className="text-gray-300">2 study sets per month</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-400 mt-0.5" /><span className="text-gray-300">PDF upload (up to 10MB)</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-400 mt-0.5" /><span className="text-gray-300">2 Messages/Day with Professor Hazel</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-400 mt-0.5" /><span className="text-gray-300">5 Flashcards & 5 Quiz Questions</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-gray-400 mt-0.5" /><span className="text-gray-300">Basic AI Podcast</span></div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 backdrop-blur-lg border border-green-700/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-green-900/20">
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
              <p className="text-gray-400 text-sm">For serious students</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">{proPrice}</span>
              <span className="text-gray-400 text-lg ml-2">{proPeriod}</span>
            </div>

            {isPro ? (
              <button disabled className="block w-full py-3 px-6 text-center btn-primary text-white font-bold rounded-xl mb-8 opacity-70 cursor-not-allowed">
                You are on the Pro Plan
              </button>
            ) : (
              <button
                onClick={openCheckout}
                disabled={loading}
                className="block w-full py-3 px-6 text-center btn-primary text-white font-bold rounded-xl mb-8 transition"
              >
                {loading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white font-semibold">Unlimited study sets</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">PDF upload (up to 100MB)</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">10 Messages/Day with Professor Hazel</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">High-quality Voice Podcasts</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">Unlimited Flashcards &amp; Quizzes</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">Advanced Note Editing &amp; Add Context</span></div>
              <div className="flex items-start gap-3"><Check className="w-5 h-5 text-green-400 mt-0.5" /><span className="text-white">Sync Across Devices</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
