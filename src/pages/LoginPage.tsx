import { useState, useRef, type KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineKey } from 'react-icons/hi';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot password state
    const [forgotMode, setForgotMode] = useState<'off' | 'email' | 'otp'>('off');
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error('Password is required');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Login successful!');
            navigate('/');
        } catch (err: any) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword(forgotEmail);
            toast.success('OTP sent to your email!');
            setForgotMode('otp');
        } catch (err: any) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit OTP');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { data } = await authAPI.resetPassword(forgotEmail, otpCode, newPassword);
            toast.success(data.message);
            setForgotMode('off');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password — Enter Email
    if (forgotMode === 'email') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{
                            width: 56, height: 56,
                            background: 'rgba(245,158,11,0.15)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, color: '#f59e0b', marginBottom: 16
                        }}>
                            <HiOutlineKey />
                        </div>
                    </div>
                    <h1>Forgot Password</h1>
                    <p className="subtitle">Enter your email to receive a verification code</p>
                    <form onSubmit={handleForgotSubmit}>
                        <div className="form-group">
                            <label><HiOutlineMail style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send OTP'}
                        </button>
                    </form>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                        onClick={() => setForgotMode('off')}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Forgot Password — Enter OTP + New Password
    if (forgotMode === 'otp') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{
                            width: 56, height: 56,
                            background: 'rgba(99,102,241,0.15)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, color: 'var(--primary-400)', marginBottom: 16
                        }}>
                            <HiOutlineKey />
                        </div>
                    </div>
                    <h1>Reset Password</h1>
                    <p className="subtitle">Enter the 6-digit code sent to <strong>{forgotEmail}</strong></p>
                    <form onSubmit={handleResetPassword}>
                        <div className="otp-input-group">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="otp-digit"
                                    value={digit}
                                    onChange={(e) => handleOTPChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                        <div className="form-group">
                            <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Minimum 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />Confirm Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Reset Password'}
                        </button>
                    </form>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                        onClick={() => { setForgotMode('email'); setOtp(['', '', '', '', '', '']); }}
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    // Normal Login
    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, marginBottom: 16
                    }}>
                        <HiOutlineShieldCheck />
                    </div>
                </div>
                <h1>Admin Portal</h1>
                <p className="subtitle">Sign in to manage your portfolio</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label><HiOutlineMail style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
                    </button>
                </form>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                    <button
                        onClick={() => { setForgotMode('email'); setForgotEmail(email); }}
                        style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', fontSize: 14, cursor: 'pointer' }}
                    >
                        Forgot Password?
                    </button>
                    <Link to="/signup" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
