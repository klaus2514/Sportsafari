import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // If using auth
import '../styles/Ground.css';

const Grounds = () => {
  const { sport } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // If using auth
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const API_BASE = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000/api' 
          : '/api';

        const response = await axios.get(`${API_BASE}/grounds`, {
          params: { sportType: sport.toLowerCase() },
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token && { 'Authorization': `Bearer ${user.token}` }) // If using auth
          },
          timeout: 10000 // 10 second timeout
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch grounds');
        }

        const availableGrounds = response.data.grounds.filter(ground => 
          ground.slots?.some(slot => !slot.isBooked && new Date(slot.date) >= new Date())
        );

        setGrounds(availableGrounds);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Failed to fetch grounds';
        
        console.error('Fetch error:', {
          error: err,
          config: err.config,
          response: err.response
        });
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGrounds();
  }, [sport, user?.token]);

  const handleBookGround = (groundId) => {
    navigate(`/book/${sport}/${groundId}`);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {sport} grounds...</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <h2>Error Loading Grounds</h2>
      <p>{error}</p>
      <div className="error-actions">
        <button onClick={() => window.location.reload()}>Retry</button>
        <button onClick={() => navigate('/')}>Return Home</button>
      </div>
    </div>
  );

  return (
    <div className="grounds-page">
      <header className="grounds-header">
        <h1>Available {sport} Grounds</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </header>

      {grounds.length > 0 ? (
        <div className="grounds-grid">
          {grounds.map((ground) => (
            <div key={ground._id} className="ground-card">
              <div className="card-image-container">
                <img 
                  src={ground.image || '/default-ground.jpg'} 
                  alt={ground.name}
                  onError={(e) => {
                    e.target.src = '/default-ground.jpg';
                  }}
                />
                <span className="price-badge">
                  ₹{ground.pricePerSlot}/slot
                </span>
              </div>
              
              <div className="card-body">
                <h3>{ground.name}</h3>
                <p className="location">
                  <i className="fas fa-map-marker-alt"></i> {ground.location}
                </p>
                <p className="capacity">
                  <i className="fas fa-users"></i> Capacity: {ground.capacity || 'N/A'}
                </p>
                
                <div className="slot-info">
                  <p>
                    <i className="fas fa-calendar-alt"></i> Available slots: {
                      ground.slots?.filter(slot => 
                        !slot.isBooked && new Date(slot.date) >= new Date()
                      ).length || 0
                    }
                  </p>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="book-btn"
                    onClick={() => handleBookGround(ground._id)}
                    disabled={!ground.slots?.some(slot => !slot.isBooked)}
                  >
                    {ground.slots?.some(slot => !slot.isBooked) ? 'Book Now' : 'Fully Booked'}
                  </button>
                  <button
                    className="details-btn"
                    onClick={() => navigate(`/grounds/${ground._id}`)}
                  >
                    <i className="fas fa-info-circle"></i> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-grounds">
          <img src="/no-results.png" alt="No grounds found" />
          <h3>No available {sport} grounds found</h3>
          <p>Please try a different date or check back later</p>
          <button 
            className="browse-btn"
            onClick={() => navigate('/sports')}
          >
            <i className="fas fa-arrow-left"></i> Browse Other Sports
          </button>
        </div>
      )}
    </div>
  );
};

export default Grounds;