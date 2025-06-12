const express = require("express");
const { Ground, Booking } = require("../models/Ground");
const authMiddleware = require("../middlewares/authMiddleware");
const cloudinary = require("../config/cloudinaryConfig");
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');

const router = express.Router();

// Check ownership middleware
const checkOwnership = async (req, res, next) => {
  try {
    const ground = await Ground.findById(req.params.groundId);
    if (!ground) return res.status(404).json({ success: false, message: "Ground not found" });
    if (!ground.owner.equals(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized: Not your ground" });
    }
    req.ground = ground;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Validate slots format
const validateSlots = (req, res, next) => {
  if (!req.body.slots || !Array.isArray(req.body.slots)) {
    return next();
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM) - ([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/;

  const invalidSlots = req.body.slots.filter(slot => {
    const isDateValid = slot.date && !isNaN(new Date(slot.date).getTime());
    const isTimeValid = slot.timeSlot && timeRegex.test(slot.timeSlot);
    return !isDateValid || !isTimeValid;
  });

  if (invalidSlots.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid slot format",
      errors: invalidSlots.map(slot => ({
        date: slot.date,
        timeSlot: slot.timeSlot,
        problem: !slot.date ? "Missing date" : 
                !slot.timeSlot ? "Missing timeSlot" :
                !timeRegex.test(slot.timeSlot) ? "Invalid time format" :
                "Invalid date format"
      }))
    });
  }

  next();
};

// Create ground
router.post(
  "/create",
  authMiddleware,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("pricePerSlot").isFloat({ min: 0 }).withMessage("Price must be ≥ 0"),
    body("image").notEmpty().withMessage("Image is required"),
  ],
  validateSlots,
  async (req, res) => {
    try {
      if (req.user.role !== "owner") {
        return res.status(403).json({ success: false, message: "Only owners can add grounds" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let imageUrl = req.body.image;
      if (req.body.image.startsWith('data:')) {
        const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
          folder: "grounds",
          resource_type: "auto"
        });
        imageUrl = uploadResponse.secure_url;
      }

      const groundData = {
        name: req.body.name,
        location: req.body.location,
        pricePerSlot: req.body.pricePerSlot,
        description: req.body.description || "",
        capacity: req.body.capacity || 0,
        amenities: req.body.amenities || [],
        sportType: req.body.sportType || "cricket",
        slots: req.body.slots || [],
        owner: new mongoose.Types.ObjectId(req.user.id),
        image: imageUrl
      };

      const newGround = new Ground(groundData);
      const savedGround = await newGround.save();
      
      res.status(201).json({
        success: true,
        message: "Ground created successfully",
        ground: savedGround
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Ground creation failed",
        error: err.message
      });
    }
  }
);

// Get all grounds
router.get("/all", async (req, res) => {
  try {
    const grounds = await Ground.find()
      .populate("owner", "name email")
      .populate("slots.bookedBy", "name email")
      .lean();

    // Get all active bookings with proper ObjectId references
    const bookings = await Booking.find({ status: 'confirmed' })
      .select('ground slot status createdAt')
      .lean();

    const enhancedGrounds = grounds.map(ground => {
      // Convert ground._id to string for comparison
      const groundIdStr = ground._id.toString();
      
      const groundBookings = bookings.filter(b => 
        b.ground && b.ground.toString() === groundIdStr
      );

      const enhancedSlots = ground.slots.map(slot => {
        const slotIdStr = slot._id ? slot._id.toString() : null;
        const booking = groundBookings.find(b => 
          b.slot && b.slot.toString() === slotIdStr
        );

        return {
          ...slot,
          bookingInfo: booking ? {
            status: booking.status,
            bookedAt: booking.createdAt
          } : null
        };
      });

      return {
        ...ground,
        slots: enhancedSlots,
        bookedSlotsCount: enhancedSlots.filter(s => s.isBooked).length
      };
    });

    res.json({ success: true, grounds: enhancedGrounds });
  } catch (err) {
    console.error("Error in /api/grounds/all:", {
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      success: false, 
      message: "Error fetching grounds",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all bookings for owner's grounds
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    // Validate owner role
    if (req.user.role !== 'owner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only owners can view bookings' 
      });
    }

    // Get all grounds owned by this user
    const ownedGrounds = await Ground.find({ owner: req.user.id }).select('_id').lean();
    const groundIds = ownedGrounds.map(g => g._id);

    // If no grounds found, return empty array
    if (groundIds.length === 0) {
      return res.json({ 
        success: true, 
        bookings: [] 
      });
    }

    // Get bookings with populated data
    const bookings = await Booking.find({ ground: { $in: groundIds } })
      .populate({
        path: 'ground',
        select: 'name location image',
        model: 'Ground'
      })
      .populate({
        path: 'user',
        select: 'name email',
        model: 'User'
      })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Format the response
    const formattedBookings = bookings.map(booking => {
      // Handle potential population issues
      const ground = booking.ground || {};
      const user = booking.user || {};

      return {
        id: booking._id,
        ground: {
          id: ground._id || null,
          name: ground.name || 'Unknown Ground',
          location: ground.location || 'Unknown Location',
          image: ground.image || '/default-ground.jpg'
        },
        user: {
          id: user._id || null,
          name: user.name || 'Unknown User',
          email: user.email || 'No email'
        },
        date: booking.date,
        timeSlot: booking.timeSlot,
        price: booking.price,
        status: booking.status,
        bookedAt: booking.createdAt
      };
    });

    res.json({ 
      success: true,
      bookings: formattedBookings
    });

  } catch (err) {
    console.error('Error in /bookings:', {
      error: err.message,
      stack: err.stack,
      userId: req.user.id
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});
// Get ground by ID
// In groundRoutes.js
router.get("/:groundId", async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.groundId)
      .populate("owner", "name email")
      .populate("slots.bookedBy", "name email");

    if (!ground) {
      return res.status(404).json({ 
        success: false,
        message: "Ground not found" 
      });
    }

    // Filter available slots (not booked and in future)
    const availableSlots = ground.slots.filter(slot => 
      !slot.isBooked && new Date(slot.date) >= new Date()
    );

    res.json({
      success: true,
      ground: {  // Changed from 'data' to 'ground'
        _id: ground._id,
        name: ground.name,
        location: ground.location,
        pricePerSlot: ground.pricePerSlot,
        image: ground.image,
        sportType: ground.sportType,
        slots: availableSlots.map(slot => ({
          _id: slot._id,
          date: slot.date,
          timeSlot: slot.timeSlot,
          isBooked: slot.isBooked
        }))
      }
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching ground", 
      error: err.message 
    });
  }
});

// Update ground
router.put(
  "/:groundId",
  authMiddleware,
  checkOwnership,
  validateSlots,
  async (req, res) => {
    try {
      const { ground } = req;

      ground.name = req.body.name || ground.name;
      ground.location = req.body.location || ground.location;
      ground.pricePerSlot = req.body.pricePerSlot || ground.pricePerSlot;
      ground.description = req.body.description || ground.description;
      ground.capacity = req.body.capacity || ground.capacity;
      ground.amenities = req.body.amenities || ground.amenities;
      ground.sportType = req.body.sportType || ground.sportType;
      ground.slots = req.body.slots || ground.slots;

      if (req.body.image && req.body.image.startsWith('data:')) {
        const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
          folder: "grounds",
        });
        ground.image = uploadResponse.secure_url;
      }

      await ground.save();
      res.json({ success: true, message: "Ground updated!", ground });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error updating ground", error: err.message });
    }
  }
);

// Delete ground
router.delete("/:groundId", authMiddleware, checkOwnership, async (req, res) => {
  try {
    await req.ground.deleteOne();
    res.json({ success: true, message: "Ground deleted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting ground", error: err.message });
  }
});

// Book slot
router.post(
  "/:groundId/slots/:slotId/book",
  authMiddleware,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ground = await Ground.findById(req.params.groundId).session(session);
      if (!ground) {
        return res.status(404).json({ success: false, message: "Ground not found" });
      }

      const slot = ground.slots.id(req.params.slotId);
      if (!slot) {
        return res.status(404).json({ success: false, message: "Slot not found" });
      }
      if (slot.isBooked) {
        return res.status(400).json({ success: false, message: "Slot already booked" });
      }

      // Create the booking record
      const newBooking = new Booking({
        ground: ground._id,
        slot: slot._id,
        user: req.user.id,
        date: slot.date,
        timeSlot: slot.timeSlot,
        price: ground.pricePerSlot
      });

      // Update the slot status
      slot.isBooked = true;
      slot.bookedBy = req.user.id;
      slot.bookingRef = newBooking._id;

      // Save both in transaction
      await newBooking.save({ session });
      await ground.save({ session });
      await session.commitTransaction();

      res.json({ 
        success: true,
        booking: {
          id: newBooking._id,
          groundId: ground._id,
          slotId: slot._id,
          date: slot.date,
          timeSlot: slot.timeSlot,
          price: ground.pricePerSlot
        }
      });

    } catch (err) {
      await session.abortTransaction();
      res.status(500).json({ 
        success: false,
        message: "Error booking slot", 
        error: err.message 
      });
    } finally {
      session.endSession();
    }
  }
);

// Get Grounds by Sport Type
router.get("/", async (req, res) => {
  try {
    const { sportType } = req.query;

    // Validate input
    if (!sportType) {
      return res.status(400).json({ 
        success: false,
        message: "Sport type is required" 
      });
    }

    const validSports = ["cricket", "football", "tennis", "badminton", "basketball","volleyball"];
    if (!validSports.includes(sportType.toLowerCase())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid sport type" 
      });
    }

    // Find available grounds
    const grounds = await Ground.find({ 
      sportType: sportType.toLowerCase(),
      "slots": {
        $elemMatch: {
          isBooked: false,
          date: { $gte: new Date() }
        }
      }
    })
    .populate('owner', 'name')
    .lean();

    res.json({
      success: true,
      grounds: grounds.map(ground => ({
        ...ground,
        slots: ground.slots.filter(slot => 
          !slot.isBooked && new Date(slot.date) >= new Date()
        )
      }))
    });

  } catch (err) {
    console.error('Error fetching grounds:', {
      error: err.message,
      stack: err.stack,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: "Server error while fetching grounds",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});
module.exports = router;