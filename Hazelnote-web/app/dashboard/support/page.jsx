"use client";
import { Mail, HelpCircle, ChevronDown } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Help & Support</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Find answers or reach out to our team.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] p-6 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Need help with your account? We usually respond within 24 hours.</p>
          <a href="mailto:support@hazelnote.com" className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl text-sm font-bold transition inline-block text-center w-full shadow-md">Send us an Email</a>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-emerald-500" /> Frequently Asked Questions</h3>
          
          <div className="space-y-4">
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">How does the daily limit work?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Free tier users can generate 1 study set every 24 hours. Pro and Max users have unlimited generations subject to fair use.</p>
              </div>
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">What file types can I upload?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Currently, we support PDF documents. We also support YouTube URL transcripts and raw voice dictation.</p>
              </div>
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">How do I cancel my subscription?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">You can cancel your Pro or Max subscription at any time from the Profile page under the Billing section.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
