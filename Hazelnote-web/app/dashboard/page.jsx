"use client";
import { Folder, FolderPlus, FolderEdit, Flame, FileText, Brain, Search, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function DashboardOverview() {
    const { generationsToday, user } = useAppContext();

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto pt-8 md:pt-12">
            <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 👋</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Ready to conquer your next exam?</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                        <Flame className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Study Streak</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">0 Days</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes Generated</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{generationsToday} Sets</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                        <Brain className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Knowledge Level</p>
                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Novice</h3>
                    </div>
                </div>
            </div>

            {/* Folders Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2.5 rounded-xl">
                            <Folder className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Folder: <span className="text-emerald-600 dark:text-emerald-400">General</span></h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                            <FolderEdit className="w-4 h-4" /> Edit
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-sm font-bold transition shadow-sm">
                            <FolderPlus className="w-4 h-4" /> New Folder
                        </button>
                    </div>
                </div>

                {/* Empty State - Replaced when sets are generated */}
                <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                        <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No study sets in this folder yet.</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Your generated notes, flashcards, and quizzes will appear here.</p>
                    <a href="/dashboard/create" className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl transition shadow-lg shadow-emerald-200 dark:shadow-none">
                        Create New Notes
                    </a>
                </div>
            </div>
        </div>
    );
}
