"use client";
import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, UserCircle, HelpCircle } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-4">
                <div className="flex items-center gap-3 mb-8 px-2 mt-2">
                    <img src="/hazelnote_logo.png" alt="HazelNote" className="w-8 h-6 object-fill rounded" />
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight">HazelNote</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="sidebar-item p-3 rounded-xl flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 transition">
                        <LayoutDashboard className="w-5 h-5 text-emerald-600" /> Dashboard
                    </Link>
                    <Link href="/dashboard/exam" className="sidebar-item p-3 rounded-xl flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 transition">
                        <HelpCircle className="w-5 h-5 text-purple-600" /> Exams
                    </Link>
                </nav>

                <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                    <Link href="/dashboard/support" className="sidebar-item p-3 rounded-xl flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 transition">
                        <HelpCircle className="w-5 h-5 text-blue-600" /> Support
                    </Link>
                    <Link href="/dashboard/profile" className="sidebar-item p-3 rounded-xl flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 transition">
                        <UserCircle className="w-5 h-5 text-slate-600" /> Profile
                    </Link>
                </div>
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto relative">
                {children}
            </main>
        </div>
    );
}
