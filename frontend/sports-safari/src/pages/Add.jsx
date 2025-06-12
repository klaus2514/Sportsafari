import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/owner-forms.css';

const AddGround = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    pricePerSlot: '',
    image: '',
    capacity: '',
    amenities: [],
    sportType: '',
    slots: [],
  });

  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const sportsOptions = ['cricket', 'football', 'tennis', 'badminton', 'basketball'];
  const amenitiesOptions = ['Changing Rooms', 'Showers', 'Parking', 'Lighting', 'Seating', 'Equipment Rental'];

  const timeSlots = [
    '10:00 AM - 12:00 PM',
    '1:00 PM - 3:00 PM',
    '3:30 PM - 5:30 PM',
    '6:00 PM - 8:00 PM',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAmenityChange = (amenity) => {
    const updatedAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities: updatedAmenities });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setErrors({...errors, image: 'Only image files are allowed'});
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors({...errors, image: 'Image must be less than 2MB'});
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setFormData({ 
        ...formData, 
        image: event.target.result 
      });
    };
    reader.onerror = () => {
      setErrors({...errors, image: 'Error reading image file'});
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlot = () => {
    const newSlot = {
      date: '',
      timeSlot: '',
    };
    setFormData({ ...formData, slots: [...formData.slots, newSlot] });
  };

  const handleSlotChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSlots = formData.slots.map((slot, idx) => 
      idx === index ? { ...slot, [name]: value } : slot
    );
    setFormData({ ...formData, slots: updatedSlots });
  };

  const handleRemoveSlot = (index) => {
    const updatedSlots = formData.slots.filter((_, idx) => idx !== index);
    setFormData({ ...formData, slots: updatedSlots });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
  
    try {
      // 1. Prepare image data
      let imageData;
      if (formData.image instanceof File) {
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.image);
        });
      } else {
        imageData = formData.image;
      }
  
      // 2. Prepare request payload
      const requestData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        location: formData.location.trim(),
        pricePerSlot: Number(formData.pricePerSlot),
        image: imageData,
        capacity: Number(formData.capacity) || 0,
        amenities: formData.amenities || [],
        sportType: formData.sportType || 'cricket',
        slots: formData.slots || []
        // owner is handled server-side via auth token
      };
  
      // 3. Make API request
      const response = await api.post('/api/grounds/create', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      navigate('/grounds');
    } catch (error) {
      console.error("Submission error:", {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
  
      if (error.response?.data?.errors) {
        setErrors(
          error.response.data.errors.reduce((acc, err) => {
            acc[err.param] = err.msg;
            return acc;
          }, {})
        );
      } else {
        setErrors({
          server: error.response?.data?.message || 
                 'Failed to create ground. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-form-container">
      <h1>Add New Sports Ground</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ground Name"
            required
          />
          {errors.name && <div className="error-text">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ground Description"
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            required
          />
          {errors.location && <div className="error-text">{errors.location}</div>}
        </div>

        <div className="form-group">
          <label>Price Per Slot</label>
          <input
            type="number"
            name="pricePerSlot"
            value={formData.pricePerSlot}
            onChange={handleChange}
            placeholder="Price per slot"
            required
          />
          {errors.pricePerSlot && <div className="error-text">{errors.pricePerSlot}</div>}
        </div>

        <div className="form-group">
          <label>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="Capacity"
          />
        </div>

        <div className="form-group">
          <label>Sport Type</label>
          <select
            name="sportType"
            value={formData.sportType}
            onChange={handleChange}
          >
            {sportsOptions.map((sport, index) => (
              <option key={index} value={sport}>{sport}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amenities</label>
          <div className="amenities-options">
            {amenitiesOptions.map((amenity, index) => (
              <label key={index}>
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                />
                {amenity}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {imagePreview && <img src={imagePreview} alt="Image Preview" />}
          {errors.image && <div className="error-text">{errors.image}</div>}
        </div>

        <div className="form-group">
          <label>Available Time Slots</label>
          {formData.slots.map((slot, index) => (
            <div key={index} className="time-slot">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={slot.date}
                  onChange={(e) => handleSlotChange(index, e)}
                />
              </div>

              <select
                name="timeSlot"
                value={slot.timeSlot}
                onChange={(e) => handleSlotChange(index, e)}
              >
                <option value="">Select Time Slot</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => handleRemoveSlot(index)}>
                Remove Time Slot
              </button>
            </div>
          ))}

          <button type="button" onClick={handleAddSlot}>
            Add New Time Slot
          </button>
        </div>

        {errors.server && <div className="error-text server-error">{errors.server}</div>}

        <div className="form-group">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Ground'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGround;