import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';
import Navbar from '../components/Navbar';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password,
        role
      });
      alert(`🎉 Registration successful as ${role}!`);
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <>
    
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Register</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            minLength="6"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group radio-group">
          <label>I'm registering as:</label>
          <div className="radio-options">
            <label className="radio-label">
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={() => setRole('user')}
              />
              <span className="radio-custom"></span>
              user
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="role"
                value="owner"
                checked={role === 'owner'}
                onChange={() => setRole('owner')}
              />
              <span className="radio-custom"></span>
              owner
            </label>
          </div>
        </div>

        <button type="submit">Create Account</button>
        <p className="login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
    </>
  );
}

export default Register;