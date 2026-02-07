import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import logoutIcon from '../assets/logout-removebg-preview.png';

import bgImage from '../assets/pngtree-black-yellow-line-geometric-display-board-background-image_345516.jpg';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar glass" style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: '100% 100%', // Stretch as requested
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}>
            <div className="container flex justify-between items-center" style={{ maxWidth: '100%', padding: '0 2rem' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', background: 'none', WebkitTextFillColor: 'initial' }}>Cargo Management</h1>
                </Link>
                <div className="flex items-center" style={{ gap: '1.5rem' }}>
                    {user ? (
                        <>
                            <span style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 'bold' }}>Hello, {user.username}</span>
                            {user.role === 'admin' ? (
                                <Link to="/admin" className="btn" style={{ background: 'var(--surface)', fontSize: '1.1rem', padding: '0.6rem 1.2rem' }}>Admin Panel</Link>
                            ) : (
                                <Link to="/dashboard" className="btn" style={{ background: 'var(--surface)', fontSize: '1.1rem', padding: '0.6rem 1.2rem' }}>Dashboard</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Logout"
                            >
                                <img src={logoutIcon} alt="Logout" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-primary" style={{ borderRadius: '5px', padding: '0.7rem 2rem', fontSize: '1.1rem' }}>Login</Link>
                            <Link to="/register" className="btn-primary" style={{ borderRadius: '5px', padding: '0.7rem 2rem', fontSize: '1.1rem' }}>Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
