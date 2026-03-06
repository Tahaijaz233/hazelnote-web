"use client";
import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, UserCircle } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar Component Here */}
            <aside className={`w-72 bg-white border-r border-gray-200 ...`}>
                <Link href="/dashboard" className="sidebar-item"><LayoutDashboard /> Dashboard</Link>
                <Link href="/dashboard/create" className="sidebar-item"><PlusCircle /> Create</Link>
                <Link href="/dashboard/profile" className="sidebar-item"><UserCircle /> Profile</Link>
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}