const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "20d" });
};

// 📝 User Registration (Sign Up)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error signing up", error: err.message });
  }
});

// 📝 User Login
// Example backend login route (Node.js/Express)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user in database
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // 3. Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Ensure role is included in JWT payload
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. Send response - CRITICAL: Include role here
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      role: user.role // MUST include this line
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📝 Get User Profile (Protected Route)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
});

module.exports = router;
