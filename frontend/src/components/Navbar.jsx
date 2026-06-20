import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/dashboard" className="nav-brand">
          <span style={{ color: 'var(--primary-color)' }}>⬡</span> ModerationAI
        </Link>
        <div className="nav-links">
          {token ? (
            <>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {username}
              </span>
              {role === 'admin' && <span className="badge badge-warning">Admin</span>}
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.4rem 0.9rem', fontSize: '0.875rem' }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
