'use client';

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, isPro, isMax, userTier, loading } = useAppContext();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.email ? user.email.split('@')[0] : 'Student'}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                        Ready to ace your next exam? Here is an overview of your progress.
                    </p>
                </div>
                <Link href="/dashboard/create">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105 flex items-center space-x-2">
                        <span>➕ Create New Note</span>
                    </button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-500 dark:text-gray-400 font-medium">Study Materials</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                            📚
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">0</p>
                    <p className="text-sm text-gray-400 mt-1">Generated Notes</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-500 dark:text-gray-400 font-medium">Exam Prep</h3>
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xl">
                            🎓
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">0</p>
                    <p className="text-sm text-gray-400 mt-1">Practice Tests Taken</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-500 dark:text-gray-400 font-medium">Subscription</h3>
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
                            ⭐
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4 uppercase tracking-wide">
                        {userTier} PLAN
                    </p>
                    {(!isPro && !isMax) ? (
                        <Link href="/pricing" className="text-sm text-orange-500 font-medium hover:text-orange-600 mt-2 inline-flex items-center">
                            Upgrade for Unlimited <span className="ml-1">&rarr;</span>
                        </Link>
                    ) : (
                        <p className="text-sm text-green-500 font-medium mt-2">Active ✨</p>
                    )}
                </div>
            </div>

            {/* Main Content Area: Recent Activity & Quick Links */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Column: Recent Notes */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Documents</h2>
                        <Link href="/dashboard/create" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            View All
                        </Link>
                    </div>
                    
                    {/* Empty State */}
                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="text-5xl mb-4 opacity-80">📄</div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No notes generated yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                            Start learning faster by uploading a PDF or pasting a YouTube link. Hazelnote will summarize it instantly.
                        </p>
                        <Link href="/dashboard/create">
                            <button className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                                Create your first note
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Quick Links */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Links</h2>
                    <div className="space-y-4">
                        <Link href="/dashboard/create" className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-orange-100 dark:hover:border-gray-600">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                    🎥
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Video to Notes</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Summarize YouTube links</p>
                                </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-orange-500 transition-colors transform group-hover:translate-x-1">&rarr;</span>
                        </Link>

                        <Link href="/dashboard/exam" className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-blue-100 dark:hover:border-gray-600">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    📝
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Practice Exam</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Test your knowledge</p>
                                </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1">&rarr;</span>
                        </Link>

                        <Link href="/dashboard/support" className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-green-100 dark:hover:border-gray-600">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                    🎧
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Help & Support</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Talk to our team</p>
                                </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-green-500 transition-colors transform group-hover:translate-x-1">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
