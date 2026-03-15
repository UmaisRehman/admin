import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineAtSymbol, HiOutlineShieldCheck } from 'react-icons/hi';

const SignupPage = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUsernameChange = (value: string) => {
        setUsername(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        if (username.length < 3) {
            toast.error('Username must be at least 3 characters');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const message = await signup({ name: name.trim(), username, email, password });
            toast.success(message || 'Account created successfully!');
            navigate('/login');
        } catch (err: any) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

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
                <h1>Create Account</h1>
                <p className="subtitle">Sign up to create your portfolio</p>
                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label><HiOutlineUser style={{ verticalAlign: 'middle', marginRight: 6 }} />Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><HiOutlineAtSymbol style={{ verticalAlign: 'middle', marginRight: 6 }} />Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="john-doe (used for your portfolio URL)"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            required
                            minLength={3}
                            maxLength={30}
                        />
                        {username && (
                            <p style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 4, marginBottom: 0 }}>
                                Your portfolio URL: <span style={{ color: 'var(--primary-400)' }}>portfolio.com/{username}</span>
                            </p>
                        )}
                    </div>
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
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: 6 }} />Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--neutral-400)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-400)', textDecoration: 'none', fontWeight: 600 }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
