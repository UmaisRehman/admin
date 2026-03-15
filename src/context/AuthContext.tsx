import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';

interface Admin {
    id: string;
    email: string;
    username: string;
    name: string;
}

interface AuthContextType {
    admin: Admin | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signup: (data: { name: string; username: string; email: string; password: string }) => Promise<string>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setIsLoading(false);
            return;
        }
        try {
            const { data } = await authAPI.checkAuth();
            setAdmin(data.admin);
        } catch {
            localStorage.removeItem('accessToken');
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (signupData: { name: string; username: string; email: string; password: string }) => {
        const { data } = await authAPI.signup(signupData);
        return data.message;
    };

    const login = async (email: string, password: string) => {
        const { data } = await authAPI.login(email, password);
        localStorage.setItem('accessToken', data.accessToken);
        setAdmin(data.admin);
    };

    const logout = async () => {
        await authAPI.logout();
        localStorage.removeItem('accessToken');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider
            value={{
                admin,
                isAuthenticated: !!admin,
                isLoading,
                signup,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
