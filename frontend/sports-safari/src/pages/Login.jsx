import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Both hooks/components imported
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Auth.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://sportsafari-2.onrender.com/', {
        email,
        password
      });
  
      console.log('Full API Response:', res.data); // Debug log
  
      if (!res.data.role) {
        // If no role in response, check JWT token instead
        const tokenData = JSON.parse(atob(res.data.token.split('.')[1]));
        console.log('Decoded Token:', tokenData);
        
        if (!tokenData.role) {
          throw new Error('Role not found in response or token');
        }
        
        // Use role from token if not in main response
        await login(res.data.token, tokenData.role, res.data.user);
        navigate(tokenData.role === 'owner' ? '/owner-dashboard' : '/user-dashboard');
      } else {
        // Normal flow with role in response
        await login(res.data.token, res.data.role, res.data.user);
        navigate(res.data.role === 'owner' ? '/owner-dashboard' : '/user-dashboard');
      }
  
    } catch (err) {
      console.error('Login error:', err);
      alert(err.response?.data?.message || 
           err.message || 
           'Login failed. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span> Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>

        <p className="auth-footer">
          New user? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
