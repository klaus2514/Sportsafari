import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/BookingPage.css';

const BookingPage = () => {
  const { sport, groundId } = useParams();
  const navigate = useNavigate();
  const [ground, setGround] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchGroundDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const API_BASE = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000/api' 
          : '/api';
        
        const response = await axios.get(`${API_BASE}/grounds/${groundId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to load ground details');
        }

        setGround(response.data.ground);
      } catch (err) {
        console.error("Error fetching ground details:", {
          error: err,
          response: err.response?.data
        });
        setError(err.response?.data?.message || err.message || 'Failed to load ground details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroundDetails();
  }, [groundId]);

  // Filter available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !ground?.slots) return;

    const filteredSlots = ground.slots.filter(slot => {
      const slotDate = new Date(slot.date).toISOString().split('T')[0];
      return slotDate === selectedDate && !slot.isBooked;
    });

    setAvailableSlots(filteredSlots);
  }, [selectedDate, ground]);

  // Get unique available dates
  const availableDates = ground?.slots
    ? [...new Set(
        ground.slots
          .filter(slot => !slot.isBooked && new Date(slot.date) >= new Date())
          .map(slot => new Date(slot.date).toISOString().split('T')[0])
      )].sort()
    : [];

  const handleBooking = async () => {
    setError(null);

    // Validate selection
    if (!selectedSlot?._id || !ground?._id) {
      setError('Please select a valid time slot');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to book a slot');
      return;
    }

    try {
      setLoading(true);
      
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000/api' 
        : '/api';

      console.log('Attempting to book:', {
        groundId: ground._id,
        slotId: selectedSlot._id
      });

      const response = await axios.post(`${API_BASE}/bookings/book`, {
        groundId: ground._id.toString(),
      slotId: selectedSlot._id.toString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });

      if (response.data.success) {
        navigate('/booking-confirmation', {
          state: {
            bookingId: response.data.booking.id,
            groundName: ground.name,
            date: selectedDate,
            timeSlot: selectedSlot.timeSlot,
            price: ground.pricePerSlot,
            bookingDetails: response.data.booking
          }
        });
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking Error:', {
        error: err.message,
        response: err.response?.data,
        request: {
          groundId: ground?._id,
          slotId: selectedSlot?._id
        }
      });
      
      setError(err.response?.data?.message || err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading ground details...</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
      <button onClick={() => navigate('/')}>Return Home</button>
    </div>
  );

  if (!ground) return (
    <div className="error-screen">
      <h2>Ground Not Found</h2>
      <p>The requested ground could not be loaded</p>
      <button onClick={() => navigate('/grounds')}>Browse Other Grounds</button>
    </div>
  );

  return (
    <div className="booking-container">
      <header className="booking-header">
        <h1>Book {ground.name}</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          &larr; Back
        </button>
      </header>

      <div className="ground-info">
        <img 
          src={ground.image || '/default-ground.jpg'} 
          alt={ground.name}
          onError={(e) => e.target.src = '/default-ground.jpg'}
        />
        <div className="ground-details">
          <p><strong>Location:</strong> {ground.location}</p>
          <p><strong>Price:</strong> ${ground.pricePerSlot.toFixed(2)} per slot</p>
          <p><strong>Sport:</strong> {ground.sportType}</p>
          {ground.capacity && <p><strong>Capacity:</strong> {ground.capacity} people</p>}
        </div>
      </div>

      <div className="booking-form">
        <h2>Select Date and Time</h2>
        
        <div className="form-group">
          <label>Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
            disabled={!availableDates.length}
          >
            <option value="">{availableDates.length ? 'Select date' : 'No available dates'}</option>
            {availableDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        {selectedDate && (
          <div className="time-slots-container">
            <h3>Available Time Slots</h3>
            {availableSlots.length > 0 ? (
              <div className="time-slots-grid">
                {availableSlots.map(slot => (
                  <button
                    key={slot._id}
                    className={`time-slot ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.timeSlot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="no-slots">No available slots for this date</p>
            )}
          </div>
        )}

        {selectedSlot && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-details">
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedSlot.timeSlot}</p>
              <p><strong>Price:</strong> ${ground.pricePerSlot.toFixed(2)}</p>
            </div>
            <button 
              onClick={handleBooking} 
              disabled={loading}
              className="confirm-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;