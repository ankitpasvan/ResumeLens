import { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from './services/auth.api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getUser();
                setUser(data.user || data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        getAndSetUser();
    }, []);

    return (
        <AuthContext.Provider value={{user, loading, setUser, setLoading}}>
            {children}
        </AuthContext.Provider>
    );
}