import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
//import '../styles/owner-bookings.css';

const ViewBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/api/bookings/owner-bookings');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings
    .flatMap(ground => 
      ground.bookings.map(booking => ({
        ...booking,
        groundName: ground.groundName,
        groundImage: ground.image,
        price: ground.pricePerSlot
      }))
    )
    .filter(booking => {
      if (filter === 'all') return true;
      return booking.status === filter;
    })
    .filter(booking => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.groundName.toLowerCase().includes(searchLower) ||
        (booking.bookedBy?.name?.toLowerCase().includes(searchLower)) ||
        booking.date.includes(searchTerm)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return 'confirmed';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-container">Loading bookings...</div>;
  }

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>Bookings Management</h1>
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found matching your criteria</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking, index) => (
            <div key={index} className="booking-card">
              <div className="booking-image">
                <img src={booking.groundImage} alt={booking.groundName} />
              </div>
              <div className="booking-details">
                <h3>{booking.groundName}</h3>
                <div className="booking-meta">
                  <span className="booking-date">{formatDate(booking.date)}</span>
                  <span className="booking-time">{booking.timeSlot}</span>
                </div>
                <div className="booking-user">
                  <span className="user-name">{booking.bookedBy?.name || 'Guest'}</span>
                  <span className="user-email">{booking.bookedBy?.email || ''}</span>
                </div>
              </div>
              <div className="booking-status">
                <span className={`status-badge ${getStatusBadge(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <span className="booking-price">₹{booking.price || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewBookings;