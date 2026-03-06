"use client";
import { HelpCircle, Mail, ChevronDown } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 pt-8 md:pt-12">
      <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Support & Help</h1>
            <p className="text-gray-500">Get answers to your questions</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Need Direct Help?
          </h3>
          <p className="text-blue-700 mb-3">Contact our support team and we'll get back to you within 24 hours.</p>
          <a href="mailto:hazelnote@free-ed.site" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            <Mail className="w-4 h-4" /> hazelnote@free-ed.site
          </a>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          
          <details className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <summary className="cursor-pointer p-5 font-bold text-gray-900 flex items-center justify-between hover:bg-gray-100 transition">
              <span>How do I create a study set?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
            </summary>
            <div className="px-5 pb-5 text-gray-600">
              <p>To create a study set, simply navigate to your Workspace/Dashboard, hit "Create Notes", and choose between a PDF Upload, Voice Dictation, or pasting a YouTube URL.</p>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <summary className="cursor-pointer p-5 font-bold text-gray-900 flex items-center justify-between hover:bg-gray-100 transition">
              <span>Is HazelNote actually free?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
            </summary>
            <div className="px-5 pb-5 text-gray-600">
              <p>Yes! Our free plan allows up to 3 study sets per month and up to 5MB PDF uploads. You can upgrade to Pro or Max at any time if you need unlimited access.</p>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <summary className="cursor-pointer p-5 font-bold text-gray-900 flex items-center justify-between hover:bg-gray-100 transition">
              <span>Can I translate my notes?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
            </summary>
            <div className="px-5 pb-5 text-gray-600">
              <p>Yes. After generating your notes, you can use the Translate button available in the study view to convert the summary or the entire document into multiple languages instantly.</p>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
}