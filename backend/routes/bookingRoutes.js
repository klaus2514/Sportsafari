const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const mongoose = require('mongoose');
const { Ground, Booking } = require('../models/Ground');

const router = express.Router();

// Request logging middleware
router.post("/book", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('Starting booking process...');
    
    // Validate user
    if (!req.user?.id) {
      throw new Error("User authentication failed - no user ID");
    }
    
    // Validate input
    const { groundId, slotId } = req.body;
    if (!groundId || !slotId) {
      throw new Error("Missing groundId or slotId");
    }

    // Convert IDs upfront
    const groundObjId = new mongoose.Types.ObjectId(groundId);
    const slotObjId = new mongoose.Types.ObjectId(slotId);
    const userObjId = new mongoose.Types.ObjectId(req.user.id);

    // Find ground with lock
    const ground = await Ground.findOne({ _id: groundObjId })
      .select('+slots')
      .session(session);
      
    if (!ground) {
      throw new Error(`Ground not found with ID: ${groundId}`);
    }

    // Find slot - more robust check
    const slot = ground.slots.id(slotObjId);
    if (!slot) {
      console.error('Slot lookup failed', {
        requestedSlot: slotId,
        availableSlots: ground.slots.map(s => s._id.toString())
      });
      throw new Error(`Slot ${slotId} not found in ground ${groundId}`);
    }

    if (slot.isBooked) {
      throw new Error(`Slot ${slotId} is already booked`);
    }

    // Create booking
    const booking = new Booking({
      ground: groundObjId,
      slot: slotObjId,
      user: userObjId,
      date: slot.date,
      timeSlot: slot.timeSlot,
      price: ground.pricePerSlot,
      status: "confirmed"
    });

    // Update slot
    slot.isBooked = true;
    slot.bookedBy = userObjId;
    slot.bookingRef = booking._id;

    // Save changes
    await booking.save({ session });
    await ground.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    console.log('Booking successfully created:', booking._id);

    res.json({
      success: true,
      booking: {
        id: booking._id,
        groundId: ground._id,
        slotId: slot._id,
        date: slot.date,
        timeSlot: slot.timeSlot,
        price: ground.pricePerSlot
      }
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("Booking Error:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
      user: req.user
    });

    res.status(500).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } finally {
    session.endSession();
  }
});

// Get all bookings made by the user
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user.id,
      status: { $ne: "cancelled" }
    })
    .populate({
      path: 'ground',
      select: 'name image location sportType pricePerSlot', // Added image
      model: 'Ground'
    })
    .lean();

    const formatted = bookings.map(b => ({
      id: b._id.toString(),
      ground: {
        id: b.ground?._id?.toString() || null,
        name: b.ground?.name || 'Unknown Ground',
        image: b.ground?.image || '/default-ground.jpg', // Added default
        location: b.ground?.location || 'Unknown location',
        sportType: b.ground?.sportType || 'Unknown sport',
        price: b.ground?.pricePerSlot || 0
      },
      slot: {
        date: b.date, // Make sure this matches your schema
        timeSlot: b.timeSlot
      },
      price: b.price || b.ground?.pricePerSlot || 0, // Fallback price
      status: b.status,
      paymentStatus: b.paymentStatus || 'pending'
    }));

    console.log('Sending bookings:', formatted.length); // Debug log

    res.json({
      success: true,
      bookings: formatted
    });
  } catch (err) {
    console.error("Bookings Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Cancel a Booking
router.delete("/:bookingId", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user.id
    }).session(session);

    if (!booking) {
      throw new Error("Booking not found or unauthorized");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking already cancelled");
    }

    await Ground.updateOne(
      { 
        _id: booking.ground,
        "slots._id": booking.slot
      },
      { 
        $set: { 
          "slots.$.isBooked": false,
          "slots.$.bookedBy": null,
          "slots.$.bookingRef": null
        } 
      },
      { session }
    );

    booking.status = "cancelled";
    await booking.save({ session });

    await session.commitTransaction();

    res.json({ 
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  } finally {
    session.endSession();
  }
});

router.get("/owner-bookings", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ 
        success: false,
        message: "Only owners can access bookings" 
      });
    }

    // 1. Get all bookings for this owner's grounds
    const bookings = await Booking.find({
      // No ground filtering - assuming bookings already reference correct grounds
    })
    .populate('user', 'name email phone')  // Only get needed user fields
    .sort({ date: -1, timeSlot: 1 });

    // 2. Format the response
    const response = bookings.map(booking => ({
      id: booking._id,
      groundId: booking.ground,  // Already contains ground ID
      date: booking.date,
      timeSlot: booking.timeSlot,
      price: booking.price,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      userName: booking.user?.name,
      userEmail: booking.user?.email,
      bookedAt: booking.createdAt
    }));

    res.json({
      success: true,
      bookings: response
    });

  } catch (err) {
    console.error("Owner bookings error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('ground')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }

    // Verify owner
    if (booking.ground.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to modify this booking" 
      });
    }

    const { status } = req.body;
    booking.status = status;
    
    // If cancelling, free up the slot
    if (status === 'cancelled') {
      await Ground.updateOne(
        { _id: booking.ground, "slots._id": booking.slot },
        { 
          $set: { 
            "slots.$.isBooked": false,
            "slots.$.bookedBy": null
          } 
        }
      );
    }

    await booking.save();

    res.json({
      success: true,
      message: "Booking status updated"
    });

  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Owner revenue stats
router.get("/owner-revenue", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can access revenue data",
      });
    }

    // ✅ FIXED this line
    const ownerId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all grounds owned by this owner
    const grounds = await Ground.find({ owner: ownerId });
    if (grounds.length === 0) {
      return res.json({
        success: true,
        totalRevenue: 0,
        totalBookings: 0,
        byGround: [],
        message: "No grounds found for this owner.",
      });
    }

    const groundIds = grounds.map((g) => g._id);
    const groundNames = {};
    grounds.forEach((ground) => {
      groundNames[ground._id.toString()] = ground.name;
    });

    // Step 2: Fetch confirmed bookings with successful payments
    const bookings = await Booking.find({
      ground: { $in: groundIds },
      status: "confirmed",
      paymentStatus: "success",
    });

    // Step 3: Calculate revenue
    let totalRevenue = 0;
    let totalBookings = 0;
    const revenueByGround = {};

    bookings.forEach((booking) => {
      const groundId = booking.ground.toString();
      const price = booking.price || 0;

      totalRevenue += price;
      totalBookings++;

      if (!revenueByGround[groundId]) {
        revenueByGround[groundId] = {
          groundId,
          groundName: groundNames[groundId] || "Unknown Ground",
          revenue: 0,
          bookings: 0,
        };
      }

      revenueByGround[groundId].revenue += price;
      revenueByGround[groundId].bookings++;
    });

    res.json({
      success: true,
      totalRevenue,
      totalBookings,
      byGround: Object.values(revenueByGround),
    });

  } catch (err) {
    console.error("Revenue Calculation Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to calculate revenue",
      error: err.message,
    });
  }
});
// Get ground by ID
router.get("/ground/:id", async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);

    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }

    const availableSlots = ground.slots.filter(slot => !slot.isBooked);

    res.status(200).json({
      location: ground.location,
      price: ground.pricePerSlot,
      capacity: ground.capacity,
      sportType: ground.sportType,
      availableSlots: availableSlots.map(slot => ({
        id: slot._id,
        date: slot.date,
        timeSlot: slot.timeSlot
      }))
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ground details", error: err.message });
  }
});

module.exports = router;