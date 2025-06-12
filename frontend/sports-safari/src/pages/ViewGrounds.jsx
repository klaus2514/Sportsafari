import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/owner-grounds.css';

const ViewGrounds = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const response = await api.get('/api/grounds/all');
        setGrounds(response.data.grounds || []);
      } catch (error) {
        console.error('Error fetching grounds:', error);
        setGrounds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrounds();
  }, []);

  const handleImageError = (e) => {
    e.target.src = '/default-ground.jpg';
    e.target.className = 'default-ground-img';
  };

  const deleteGround = async (id) => {
    if (window.confirm('Are you sure you want to delete this ground?')) {
      try {
        await api.delete(`/api/grounds/${id}/delete`);
        setGrounds(grounds.filter(ground => ground._id !== id));
      } catch (error) {
        console.error('Error deleting ground:', error);
        alert('Failed to delete ground. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading-container">Loading grounds...</div>;
  }

  return (
    <div className="owner-grounds-container">
      <div className="header-section">
        <h1>My Sports Grounds</h1>
        <Link to="/add-ground" className="add-btn">
          Add New Ground
        </Link>
      </div>

      {grounds.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any grounds yet.</p>
          <Link to="/owner/add-ground" className="primary-btn">
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
                <div className="actions">
                  <button
                    onClick={() => navigate(`/owner/grounds/${ground._id}/edit`)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/owner/grounds/${ground._id}/slots`)}
                    className="slots-btn"
                  >
                    Manage Slots
                  </button>
                  <button
                    onClick={() => deleteGround(ground._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewGrounds;