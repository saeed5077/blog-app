import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">✍️ BlogApp</Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {user ? (
          <>
            <Link to="/posts/create" className="btn-primary">
              + New Post
            </Link>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Hey, {user?.name?.split(' ')[0]}
            </span>
            <button className="btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;