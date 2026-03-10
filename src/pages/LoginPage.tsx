import { useState, useRef, type KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';

const LoginPage = () => {
    const { login, verifyOTP } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('OTP sent to your email!');
            setStep('otp');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
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

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete OTP');
            return;
        }
        setLoading(true);
        try {
            await verifyOTP(email, otpCode);
            toast.success('Login successful!');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {step === 'credentials' ? (
                    <>
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
                                <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />Password (Optional)</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Leave empty for passwordless login"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send OTP'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 8 }}>
                            <div style={{
                                width: 56, height: 56,
                                background: 'rgba(99,102,241,0.15)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26, color: 'var(--primary-400)', marginBottom: 16
                            }}>
                                <HiOutlineMail />
                            </div>
                        </div>
                        <h1>Verify OTP</h1>
                        <p className="subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
                        <form onSubmit={handleVerifyOTP}>
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
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Verify & Login'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}
                            >
                                Back to Login
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
