'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Add TypeScript definitions for the Freemius SDK
declare global {
  interface Window {
    FS: any;
  }
}

export default function Pricing() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user is already a Pro subscriber
        const profileRef = doc(db, 'profiles', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists() && snap.data().is_pro) {
          setIsPro(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const openCheckout = (billingCycle: 'monthly' | 'annual') => {
    if (!user) {
      alert("Please log in or create an account to upgrade to Pro.");
      router.push('/login?redirect=/pricing');
      return;
    }

    if (!window.FS) {
      alert("Checkout SDK is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      // Initialize the Freemius Checkout
      const handler = window.FS.Checkout.configure({
        plugin_id: process.env.NEXT_PUBLIC_FREEMIUS_PRODUCT_ID,
        public_key: process.env.NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY,
        image: '/hazelnote_logo.png', // Shown in the checkout popup
      });

      // Open the popup using only the Plan ID and passing the billing cycle
      handler.open({
        name: 'HazelNote Pro',
        plan_id: process.env.NEXT_PUBLIC_FREEMIUS_PLAN_ID,
        billing_cycle: billingCycle, // Pre-selects Monthly or Annual in the Freemius modal
        user_email: user.email, // Automatically links purchase to this user's email
        success: function (response: any) {
          alert("Payment successful! Welcome to HazelNote Pro.");
          router.push('/dashboard');
        }
      });
    } catch (err) {
      console.error("Freemius Checkout Error:", err);
      alert("Failed to load checkout. Please check your configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-green-500/30">
      {/* Freemius SDK Script */}
      <Script src="https://checkout.freemius.com/checkout.min.js" strategy="lazyOnload" />

      <nav className="p-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <img src="/hazelnote_logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-extrabold text-xl tracking-tight hidden sm:block">HazelNote</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Supercharge Your Study Sessions
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Unlock unlimited AI generations, advanced exam modes, and premium features to ace your classes.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-bold ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-green-500 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Annually <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-green-200 ml-1">Save 20%</span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          
          {/* Free Tier */}
          <div className="glass-card p-8 dark:bg-gray-800 dark:border-gray-700 flex flex-col opacity-90">
            <h3 className="text-2xl font-extrabold mb-2">Basic</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 h-10">Perfect to try out HazelNote's core features.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">/ forever</span>
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                '2 Study Sets generated per month',
                'Standard study modes',
                'Basic AI feedback',
                'Standard support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/dashboard" className="w-full py-4 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition text-center border border-gray-200 dark:border-gray-600 block">
              Current Plan
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="glass-card p-8 border-2 border-green-500 dark:border-green-500 relative flex flex-col shadow-2xl dark:bg-slate-800 scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-lg">
              <Zap className="w-3 h-3 fill-current" /> Most Popular
            </div>
            <h3 className="text-2xl font-extrabold mb-2">HazelNote Pro</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 h-10">Everything you need to master your exams.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">{isAnnual ? '$7.99' : '$9.99'}</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">/ month</span>
              {isAnnual && <div className="text-xs text-green-500 font-bold mt-1">Billed $95.88 annually</div>}
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                'Unlimited Study Sets generation',
                'Advanced AI Exam Simulations',
                'Upload PDFs & lengthy documents',
                'Detailed analytics & progress tracking',
                'Priority customer support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-800 dark:text-gray-100 font-bold">{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button disabled className="w-full py-4 rounded-xl font-bold bg-green-500 text-white text-center flex items-center justify-center gap-2 opacity-70 cursor-not-allowed">
                <Check className="w-5 h-5" /> You are on the Pro Plan
              </button>
            ) : (
              <button 
                onClick={() => openCheckout(isAnnual ? 'annual' : 'monthly')}
                disabled={loading}
                className="btn-primary w-full py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition text-center flex items-center justify-center gap-2"
              >
                {loading ? 'Loading Secure Checkout...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
          Secure payments powered by 
          <a href="https://freemius.com" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-700 dark:text-gray-300 hover:text-green-500 transition ml-1">
             Freemius
          </a>
        </div>
      </main>
    </div>
  );
}
