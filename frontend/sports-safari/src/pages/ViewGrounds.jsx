import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/owner-grounds.css';

const ViewGrounds = () => {
  const { user } = useAuth();
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerGrounds = async () => {
      try {
        // Fetch only grounds belonging to the logged-in owner
        const response = await api.get(`/api/grounds/owner/${user.id}`);
        setGrounds(response.data.grounds || []);
      } catch (error) {
        console.error('Error fetching grounds:', error);
        setError('Failed to load your grounds. Please try again.');
        setGrounds([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchOwnerGrounds();
    }
  }, [user]);

  const handleImageError = (e) => {
    e.target.src = '/default-ground.jpg';
    e.target.className = 'default-ground-img';
  };

  const deleteGround = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this ground?')) return;
    
    try {
      await api.delete(`/api/grounds/${id}`);
      setGrounds(grounds.filter(ground => ground._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 
        'Failed to delete ground. You may not have permission.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading your grounds...</div>;
  }

  return (
    <div className="owner-grounds-container">
      <div className="header-section">
        <h1>My Sports Grounds</h1>
        <Link to="/add-ground" className="add-btn">
          Add New Ground
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {grounds.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any grounds yet.</p>
          <Link to="/add-ground" className="primary-btn">
            Add Your First Ground
          </Link>
        </div>
      ) : (
        <div className="grounds-grid">
          {grounds.map(ground => (
            <div key={ground._id} className="ground-card">
              <div className="ground-image">
                <img 
                  src={ground.image || '/default-ground.jpg'} 
                  alt={ground.name}
                  onError={handleImageError}
                />
              </div>
              <div className="ground-details">
                <h3>{ground.name}</h3>
                <p className="location">{ground.location}</p>
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-label">Price/Slot</span>
                    <span className="stat-value">₹{ground.pricePerSlot}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Bookings</span>
                    <span className="stat-value">
                      {ground.slots.filter(slot => slot.isBooked).length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteGround(ground._id)}
                  className="delete-btn"
                >
                  Delete Ground
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewGrounds;
