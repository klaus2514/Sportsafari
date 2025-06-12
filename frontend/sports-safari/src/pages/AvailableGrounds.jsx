import React, { useState } from 'react';
import axios from 'axios';
//import './styles/availableGrounds.css'; // optional CSS

const AvailableGrounds = () => {
  const [sportType, setSportType] = useState('cricket');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailableGrounds = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post('http://localhost:5000/api/grounds/availability', {
        sportType,
        date,
        timeSlot
      });
      setGrounds(res.data);
    } catch (err) {
      setError('Something went wrong while fetching grounds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="available-grounds-container">
      <h2>Find Available Grounds</h2>

      <div className="form-section">
        <label>Sport:</label>
        <select value={sportType} onChange={e => setSportType(e.target.value)}>
          <option value="cricket">Cricket</option>
          <option value="football">Football</option>
          <option value="tennis">Tennis</option>
          <option value="badminton">Badminton</option>
          <option value="basketball">Basketball</option>
        </select>

        <label>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        <label>Time Slot:</label>
        <input
          type="text"
          placeholder="e.g., 10:00 AM - 11:00 AM"
          value={timeSlot}
          onChange={e => setTimeSlot(e.target.value)}
        />

        <button onClick={fetchAvailableGrounds}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grounds-list">
        {grounds.length === 0 && !loading && <p>No grounds available for selected criteria.</p>}
        {grounds.map(ground => (
          <div key={ground._id} className="ground-card">
            <img src={ground.image} alt={ground.name} />
            <h3>{ground.name}</h3>
            <p>{ground.description}</p>
            <p><strong>Location:</strong> {ground.location}</p>
            <p><strong>Price:</strong> ₹{ground.pricePerSlot}</p>
            <p><strong>Capacity:</strong> {ground.capacity}</p>
            <p><strong>Amenities:</strong> {ground.amenities.join(', ')}</p>
            <button className="book-btn">Book Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableGrounds;
