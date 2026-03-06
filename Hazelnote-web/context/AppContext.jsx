"use client";
import { createContext, useContext, useState, useEffect } from 'react';
// CHANGED: Using relative path instead of the @/ shortcut
import { auth, db } from '../lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [tier, setTier] = useState('free');
    const [studyHistory, setStudyHistory] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Fetch profile logic here...
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{ user, tier, studyHistory, setStudyHistory }}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
