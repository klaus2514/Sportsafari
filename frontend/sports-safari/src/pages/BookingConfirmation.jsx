import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/BookingConfirmation.css';

const BookingConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if state exists, otherwise try to fetch from localStorage
    if (state) {
      setBookingData(state);
      setLoading(false);
      // Optionally save to localStorage as backup
      localStorage.setItem('lastBooking', JSON.stringify(state));
    } else {
      // Try to recover from localStorage if page is refreshed
      const savedBooking = localStorage.getItem('lastBooking');
      if (savedBooking) {
        setBookingData(JSON.parse(savedBooking));
      } else {
        setError('No booking information found');
      }
      setLoading(false);
    }
  }, [state]);

  if (loading) {
    return <div className="loading">Loading booking details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="no-data">
        <h2>No Booking Information Found</h2>
        <p>Please make a new booking</p>
        <button onClick={() => navigate('/grounds')}>Book a Ground</button>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-header">
        <h1>Booking Confirmed!</h1>
        <div className="confirmation-icon">✓</div>
      </div>
      
      <div className="booking-details">
        <h2>Booking Details</h2>
        <div className="detail-row">
          <span className="detail-label">Ground:</span>
          <span className="detail-value">{bookingData.groundName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">
            {new Date(bookingData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Time Slot:</span>
          <span className="detail-value">{bookingData.timeSlot}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span className="detail-value">${bookingData.price.toFixed(2)}</span>
        </div>
        {bookingData.bookingId && (
          <div className="detail-row">
            <span className="detail-label">Booking ID:</span>
            <span className="detail-value">{bookingData.bookingId}</span>
          </div>
        )}
      </div>

      <div className="confirmation-actions">
        <button 
          className="print-btn"
          onClick={() => window.print()}
        >
          Print Confirmation
        </button>
        <button 
          className="home-btn"
          onClick={() => navigate('/')}
        >
          Return Home
        </button>
        <button 
          className="new-booking-btn"
          onClick={() => navigate('/grounds')}
        >
          Make Another Booking
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;