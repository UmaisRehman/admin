import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';

interface Admin {
    id: string;
    email: string;
}

interface AuthContextType {
    admin: Admin | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<{ email: string }>;
    verifyOTP: (email: string, otp: string) => Promise<void>;
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

    const login = async (email: string, password?: string) => {
        const { data } = await authAPI.login(email, password);
        return { email: data.email };
    };

    const verifyOTP = async (email: string, otp: string) => {
        const { data } = await authAPI.verifyOTP(email, otp);
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
                login,
                verifyOTP,
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
