import { useState, useEffect } from 'react';
import { projectsAPI, profileAPI, getErrorMessage } from '../services/api';
import { HiOutlineCollection, HiOutlineClock, HiOutlineStar, HiOutlineUser } from 'react-icons/hi';
import toast from 'react-hot-toast';

const DashboardHome = () => {
    const [stats, setStats] = useState({ totalProjects: 0, featuredProjects: 0, lastUpdated: '' });
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [projectsRes, profileRes] = await Promise.all([
                projectsAPI.getAll(),
                profileAPI.get()
            ]);
            const projects = projectsRes.data.projects;
            const profile = profileRes.data.profile;
            setProfileName(profile.name || 'Admin');

            if (profile?.avatarUrl) {
                const favicon = document.getElementById('favicon') as HTMLLinkElement;
                if (favicon) favicon.href = profile.avatarUrl;
            }
            setStats({
                totalProjects: projects.length,
                featuredProjects: projects.filter((p: any) => p.featured).length,
                lastUpdated: projects.length > 0
                    ? new Date(projects[0].updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    })
                    : 'No projects yet'
            });
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Welcome back, {profileName} 👋</h1>
                <p className="page-subtitle">Here's what's happening with your portfolio</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><HiOutlineCollection /></div>
                    <div className="stat-info">
                        <h3>{stats.totalProjects}</h3>
                        <p>Total Projects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                        <HiOutlineStar />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.featuredProjects}</h3>
                        <p>Featured</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
                        <HiOutlineClock />
                    </div>
                    <div className="stat-info">
                        <h3 style={{ fontSize: 16 }}>{stats.lastUpdated}</h3>
                        <p>Last Updated</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--info)' }}>
                        <HiOutlineUser />
                    </div>
                    <div className="stat-info">
                        <h3 style={{ fontSize: 16 }}>Active</h3>
                        <p>Profile Status</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-50)', marginBottom: 12 }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="/projects" className="btn btn-primary">Manage Projects</a>
                    <a href="/profile" className="btn btn-secondary">Edit Profile</a>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
