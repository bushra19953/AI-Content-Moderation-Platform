import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const r = localStorage.getItem('role');
    if (!r) {
      navigate('/');
    } else {
      setRole(r);
    }
  }, [navigate]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="glass-panel">
        <p>Welcome to your dashboard. You are logged in as <strong style={{ textTransform: 'capitalize' }}>{role}</strong>.</p>
        <p className="mt-4 text-secondary">
          The core architecture is now fully integrated with the Node/Express backend! 
          You can test authentication (Register/Login) to verify the connection.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
