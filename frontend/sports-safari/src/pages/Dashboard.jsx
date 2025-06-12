import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';
import axios from 'axios';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sports');
  const [bookings, setBookings] = useState([]);

  const bookingsList = Array.isArray(bookings) ? bookings : [];
  
  const sports = [
    { name: "Cricket", image: "/Cricket.jpg", color: "#4CAF50" },
    { name: "Football", image: "/Football.jpg", color: "#2196F3" },
    { name: "Tennis", image: "/Tennis.jpg", color: "#FF5722" },
    { name: "Golf", image: "/Golf.jpg", color: "#009688" },
    { name: "Out Skating", image: "/OutSkating.jpg", color: "#9C27B0" }
  ];
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`api/bookings/my-bookings`, {
          headers:{
            'Authorization':`bearer ${token}`
          }
        });
        setBookings(response.data ||[]);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }
    };
     if (activeTab === 'bookings') {
    fetchBookings();
  }
}, [activeTab]);

  const handleSportClick = (sport) => {
    navigate(`/book-ground/${sport.toLowerCase()}`);
  };

  const handleBookNowClick = (sport, e) => {
    e.stopPropagation(); // Prevent card click from triggering
    navigate(`/Grounds/${sport.toLowerCase()}`);
  };

  const handleBookingCardClick = (booking) => {
    // Navigate to booking details or edit page
    navigate(`/booking/${booking.id}`);
  };

  return (
    <div className="user-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Manage your sports activities</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'sports' ? 'active' : ''}`}
          onClick={() => setActiveTab('sports')}
        >
          Book Sports
        </button>
        
      </div>

      {/* Sports Booking Section */}
      {activeTab === 'sports' && (
        <div className="content-section">
          <h2>Available Sports</h2>
          <div className="sports-grid">
            {sports.map((sport) => (
              <div 
                key={sport.name}
                className="sport-card"
                onClick={() => handleSportClick(sport.name)}
              >
                <div className="card-image" style={{ background: sport.color }}>
                  <img src={sport.image} alt={sport.name} />
                </div>
                <div className="card-content">
                  <h3>{sport.name}</h3>
                  <button 
                    className="book-btn"
                    onClick={(e) => handleBookNowClick(sport.name, e)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Section */}
      {activeTab === 'bookings' && (
        <div className="content-section">
          <h2>Your Bookings</h2>
          {bookings.length > 0 ? (
            <div className="bookings-list">
              {bookingsList.map(booking => (
                <div 
                  key={booking.id} 
                  className="booking-card"
                  onClick={() => handleBookingCardClick(booking)}
                >
                  <div className="booking-icon" style={{ 
                    background: sports.find(s => s.name === booking.sport)?.color 
                  }}>
                    {booking.sport.charAt(0)}
                  </div>
                  <div className="booking-details">
                    <h3>{booking.ground.name}</h3>
                    <p>{booking.ground.location}</p>
                    <div className="booking-meta">
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                      <span>{booking.time}</span>
                    </div>
                  </div>
                  <div className={`booking-status ${booking.status}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No bookings yet</p>
              <button 
                className="primary-btn"
                onClick={() => setActiveTab('sports')}
              >
                Book a Sport
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;