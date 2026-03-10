import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineDocumentText, HiOutlineUpload, HiOutlineTrash, HiOutlineLockClosed } from 'react-icons/hi';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [tagline, setTagline] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [github, setGithub] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [website, setWebsite] = useState('');
    const [skills, setSkills] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [resumeUrl, setResumeUrl] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeUploading, setResumeUploading] = useState(false);

    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await profileAPI.get();
            const p = data.profile;
            setName(p.name || '');
            setTagline(p.tagline || '');
            setBio(p.bio || '');
            setEmail(p.email || '');
            setPhone(p.phone || '');
            setLocation(p.location || '');
            setGithub(p.github || '');
            setLinkedin(p.linkedin || '');
            setWebsite(p.website || '');
            setSkills(p.skills?.join(', ') || '');
            setAvatarUrl(p.avatarUrl || '');
            setResumeUrl(p.resumeUrl || '');
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('tagline', tagline);
        formData.append('bio', bio);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('location', location);
        formData.append('github', github);
        formData.append('linkedin', linkedin);
        formData.append('website', website);
        formData.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)));
        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            const { data } = await profileAPI.update(formData);
            setAvatarUrl(data.profile.avatarUrl);
            toast.success('Profile updated!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleResumeUpload = async () => {
        if (!resumeFile) {
            toast.error('Please select a PDF file first');
            return;
        }
        setResumeUploading(true);
        const formData = new FormData();
        formData.append('resume', resumeFile);

        try {
            const { data } = await profileAPI.uploadResume(formData);
            setResumeUrl(data.resumeUrl);
            setResumeFile(null);
            toast.success('Resume uploaded!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setResumeUploading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setUpdatingPassword(true);
        try {
            // Import and call authAPI.updatePassword (Make sure it's exported from api.ts or use authAPI directly)
            // Wait, we need to import authAPI at the top. Let's assume authAPI is imported.
            const { authAPI } = await import('../services/api');
            await authAPI.updatePassword(newPassword);
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Profile & Resume</h1>
                <p className="page-subtitle">Manage your personal information and CV</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Profile Form */}
                <div className="card">
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-50)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiOutlineUser style={{ color: 'var(--primary-400)' }} /> Personal Info
                    </h2>
                    <form onSubmit={handleSaveProfile}>
                        {/* Avatar */}
                        <div className="form-group" style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{
                                width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px',
                                background: 'var(--neutral-800)', overflow: 'hidden', border: '3px solid var(--neutral-700)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {avatarUrl || avatarFile ? (
                                    <img src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl} alt="avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <HiOutlineUser style={{ fontSize: 36, color: 'var(--neutral-500)' }} />
                                )}
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => document.getElementById('avatar-input')?.click()}>
                                Change Avatar
                            </button>
                            <input id="avatar-input" type="file" accept="image/*" hidden onChange={(e) => {
                                if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
                            }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="form-group">
                                <label>Tagline</label>
                                <input className="form-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Full Stack Developer" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea className="form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell about yourself..." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Location</label>
                            <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Islamabad, Pakistan" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>GitHub</label>
                                <input className="form-input" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                            </div>
                            <div className="form-group">
                                <label>LinkedIn</label>
                                <input className="form-input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Website</label>
                            <input className="form-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                        </div>

                        <div className="form-group">
                            <label>Skills (comma separated)</label>
                            <input className="form-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, TypeScript, MongoDB" />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                {/* Right Column (Resume & Password) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Resume Section */}
                    <div className="card">
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-50)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HiOutlineDocumentText style={{ color: 'var(--primary-400)' }} /> Resume / CV
                        </h2>

                        {resumeUrl && (
                            <div style={{
                                background: 'var(--neutral-800)', borderRadius: 'var(--radius-md)', padding: 16,
                                marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <HiOutlineDocumentText style={{ fontSize: 28, color: 'var(--primary-400)' }} />
                                    <div>
                                        <p style={{ color: 'var(--neutral-200)', fontWeight: 600, fontSize: 14 }}>Current Resume</p>
                                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--primary-400)' }}>
                                            View PDF ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="file-drop-zone" onClick={() => document.getElementById('resume-input')?.click()}>
                            <HiOutlineUpload style={{ fontSize: 32, color: 'var(--neutral-500)' }} />
                            <p>{resumeFile ? resumeFile.name : 'Click to upload new resume (PDF)'}</p>
                        </div>
                        <input id="resume-input" type="file" accept=".pdf" hidden onChange={(e) => {
                            if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                        }} />

                        {resumeFile && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <button className="btn btn-primary" onClick={handleResumeUpload} disabled={resumeUploading} style={{ flex: 1, justifyContent: 'center' }}>
                                    {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setResumeFile(null)}>
                                    <HiOutlineTrash />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Password Update Section */}
                    <div className="card">
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-50)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HiOutlineLockClosed style={{ color: 'var(--primary-400)' }} /> Security
                        </h2>

                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 chars)"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={updatingPassword}>
                                {updatingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
