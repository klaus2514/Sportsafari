import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Confirm = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchBookings = async () => {
    console.log('User token:', user?.token);

    try {
      console.log('Fetching bookings...');
      const { data } = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Fetched bookings:', data);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Booking fetch failed:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) return <p>Loading bookings...</p>;

  if (!bookings || bookings.length === 0) return <p>No bookings found.</p>;

  return (
    <div>
      <h2>My Bookings</h2>
      {bookings.map((b) => (
        <div key={b.id} style={{ border: '1px solid #ccc', margin: '1rem', padding: '1rem' }}>
          <img
            src={b.ground.image || '/default-ground.jpg'}
            alt={b.ground.name}
            style={{ width: '200px' }}
          />
          <h3>{b.ground.name}</h3>
          <p>{b.ground.location} - {b.ground.sportType}</p>
          <p>Date: {new Date(b.slot.date).toLocaleDateString()}</p>
          <p>Time: {b.slot.timeSlot}</p>
          <p>Price: ₹{b.price}</p>
          <p>Status: {b.status}</p>
          <p>Payment Status: {b.paymentStatus}</p>
        </div>
      ))}
    </div>
  );
};

export default Confirm;
