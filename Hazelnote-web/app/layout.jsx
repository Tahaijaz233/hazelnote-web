'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../context/AppContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
    const { isDarkMode, toggleTheme, user, isPro, isMax, userTier } = useAppContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'Create Notes', path: '/dashboard/create', icon: '📝' },
        { name: 'Exam Prep', path: '/dashboard/exam', icon: '🎓' },
        { name: 'Profile', path: '/dashboard/profile', icon: '👤' },
        { name: 'Support', path: '/dashboard/support', icon: '💬' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 overflow-hidden">
            
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/dashboard" className="text-2xl font-bold text-orange-500">
                        Hazelnote
                    </Link>
                    <button className="lg:hidden text-gray-500 dark:text-gray-400" onClick={toggleSidebar}>
                        ✕
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.name} href={item.path} onClick={() => setIsSidebarOpen(false)}>
                                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium'}`}>
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 truncate">
                          <p className="text-sm font-semibold truncate text-gray-800 dark:text-gray-200">{user?.email || 'Loading User...'}</p>
                          <p className="text-xs font-bold tracking-wider text-orange-500 uppercase mt-0.5">{userTier} PLAN</p>
                      </div>
                   </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Top Navbar */}
                <header className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <button 
                            className="lg:hidden p-2 -ml-2 mr-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                            onClick={toggleSidebar}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Dark Mode Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-all duration-200 flex items-center justify-center w-10 h-10 shadow-inner"
                            aria-label="Toggle Dark Mode"
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <span className="text-lg leading-none">{isDarkMode ? '☀️' : '🌙'}</span>
                        </button>
                    </div>
                </header>

                {/* Main Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
