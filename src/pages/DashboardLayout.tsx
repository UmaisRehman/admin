import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineViewGrid, HiOutlineCollection, HiOutlineUser, HiOutlineLogout } from 'react-icons/hi';

const DashboardLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <span>Portfolio</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <HiOutlineViewGrid /> Dashboard
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <HiOutlineCollection /> Projects
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <HiOutlineUser /> Profile & Resume
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item" onClick={handleLogout}>
                        <HiOutlineLogout /> Logout
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
