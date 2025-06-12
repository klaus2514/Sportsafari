const mongoose = require("mongoose");

const GroundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pricePerSlot: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  capacity: { type: Number },
  amenities: { type: [String] },
  sportType: { 
    type: String, 
    enum: ["cricket", "football", "tennis", "badminton", "basketball"], 
    default: "Cricket" 
  },
  slots: [{
    date: { type: Date, required: true },
    timeSlot: { 
      type: String, 
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM) - ([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/ 
    },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    bookingRef: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" } // Reference to booking document
  }],
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  ground: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Ground", 
    required: true 
  },
  slots: [{
  _id: mongoose.Schema.Types.ObjectId, // Must be present
  date: Date,
  timeSlot: String,
  isBooked: Boolean,
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
}],
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  timeSlot: {
    type: String,
    required: true
  },
  price: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed"],
    default: "confirmed"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded","success"],
    default: "success"
  }
}, { timestamps: true });

// Create models
const Ground = mongoose.model("Ground", GroundSchema);
const Booking = mongoose.model("Booking", BookingSchema);

module.exports = { Ground, Booking };