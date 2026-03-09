'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  UserCircle,
  HelpCircle,
  Menu,
  X,
  Mail,
  ChevronDown,
} from 'lucide-react';

export default function Support() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const faqs = [
    {
      question: 'How do I create a study set?',
      answer: 'To create a study set, simply navigate to your Workspace/Dashboard, hit "Create Notes", and choose between a PDF Upload, Voice Dictation, or pasting a YouTube URL.',
    },
    {
      question: 'Is HazelNote actually free?',
      answer: 'Yes! Our free plan allows up to 1 study set per month and up to 5MB PDF uploads. You can upgrade to Pro at any time if you need unlimited access and advanced AI features.',
    },
    {
      question: 'Can I translate my notes?',
      answer: 'Yes. After generating your notes, you can use the Translate button available in the study view to convert the summary or the entire document into multiple languages instantly.',
    },
    {
      question: 'How do I cancel my Pro subscription?',
      answer: 'You can manage your plan directly from the Profile & Settings page. If you cancel, your premium benefits will continue until the end of your current billing cycle.',
    },
  ];

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
        <Link href="/profile/" className="w-full text-left sidebar-item flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <UserCircle className="w-5 h-5" /> Profile & Settings
        </Link>
        <Link href="/support/" className="w-full text-left sidebar-item active flex items-center gap-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
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

      <main className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-slate-900">
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

        <div className="max-w-4xl mx-auto p-8 pt-8 md:pt-12">
          <div className="glass-card p-8 mb-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Support & Help</h1>
                <p className="text-gray-500 dark:text-gray-400">Get answers to your questions</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Need Direct Help?
              </h3>
              <p className="text-blue-700 dark:text-blue-400 mb-3">Contact our support team and we&apos;ll get back to you within 24 hours.</p>
              <a href="mailto:hazelnote@free-ed.site" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                <Mail className="w-4 h-4" /> hazelnote@free-ed.site
              </a>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-gray-50 dark:bg-gray-700/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                  <summary className="cursor-pointer p-5 font-bold text-gray-900 dark:text-white flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 dark:text-gray-300">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
