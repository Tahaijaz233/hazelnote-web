"use client";
import { Mail, HelpCircle } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pt-8 md:pt-12">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Help & Support</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Find answers or reach out to our team.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[24px] p-8 shadow-sm text-center max-w-lg mx-auto w-full">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Need help with your account? We usually respond within 24 hours.</p>
          <a href="mailto:support@hazelnote.com" className="bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3.5 rounded-xl font-bold transition inline-block shadow-md">Send us an Email</a>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-emerald-500" /> Frequently Asked Questions</h3>
          
          <div className="space-y-4">
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">How does the daily limit work?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">Free tier users can generate 1 study set every 24 hours. Pro and Max users have unlimited generations to study without limits.</p>
              </div>
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">What file types can I upload?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">Currently, we support PDF documents. We also support pasting YouTube URLs and raw voice dictation for instant transcript processing.</p>
              </div>
              <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                  <h4 className="font-bold text-gray-900 dark:text-white text-md">How do I cancel my subscription?</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">You can easily manage or cancel your Pro or Max subscription at any time from the Profile page under the Subscription & Billing section.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
