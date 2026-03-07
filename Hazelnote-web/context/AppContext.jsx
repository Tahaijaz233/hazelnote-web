'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userTier, setUserTier] = useState('free'); // 'free', 'pro', 'max'
    const [loading, setLoading] = useState(true);

    // Dark Mode Initialization
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                setIsDarkMode(true);
                document.documentElement.classList.add('dark');
            } else {
                setIsDarkMode(false);
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    // Dark Mode Toggle Function
    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newTheme = !prev;
            if (newTheme) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newTheme;
        });
    };

    // Firebase Auth & User Tier Listener
    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser && db) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists() && userDoc.data().tier) {
                        setUserTier(userDoc.data().tier);
                    } else {
                        setUserTier('free');
                    }
                } catch (error) {
                    console.error("Error fetching user tier:", error);
                    setUserTier('free');
                }
            } else {
                setUserTier('free');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isPro = userTier === 'pro' || userTier === 'max';
    const isMax = userTier === 'max';

    return (
        <AppContext.Provider value={{ user, isDarkMode, toggleTheme, userTier, isPro, isMax, loading }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
