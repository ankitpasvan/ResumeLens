/* eslint-disable react-refresh/only-export-components -- colocated AuthContext + AuthProvider is the established pattern in this codebase */
import { createContext, useState, useEffect, useCallback } from 'react';
import { getUser } from './services/auth.api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const data = await getUser();
            const nextUser = data.user || data || null;
            setUser(nextUser);
            return nextUser;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await refreshUser();
            setLoading(false);
        };
        init();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{user, loading, setUser, setLoading, refreshUser}}>
            {children}
        </AuthContext.Provider>
    );
}
