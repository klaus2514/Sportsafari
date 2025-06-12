const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const Ground = require("../models/Ground");
const axios = require("axios");

const router = express.Router();

// Ollama Chatbot Endpoint
router.post("/ask", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.userId;
    
    // Get user's booking history for context
    const userGrounds = await Ground.find({ "slots.bookedBy": userId });
    
    // Create context for AI
    const context = {
      userBookings: userGrounds.map(g => ({
        ground: g.name,
        bookings: g.slots.filter(s => s.bookedBy?.toString() === userId)
      })),
      currentDate: new Date().toISOString()
    };
    
    const prompt = `
      You are a sports ground booking assistant. Be friendly and helpful.
      Context: ${JSON.stringify(context)}
      User question: ${question}
      
      Answer questions about:
      - Ground availability
      - Booking procedures
      - Pricing
      - Amenities
      - Cancellation policies
      
      Keep responses concise and accurate. If unsure, say you don't know.
    `;
    
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "llama2", // or any model you have installed
      prompt: prompt,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json({ answer: response.data.response });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ 
      message: "Chatbot is currently unavailable",
      error: err.message 
    });
  }
});

// Local FAQ fallback
router.get("/faqs", async (req, res) => {
  const faqs = [
    {
      question: "How do I book a ground?",
      answer: "1. Find a ground 2. Select available slot 3. Confirm booking"
    },
    {
      question: "What's the cancellation policy?",
      answer: "Cancel up to 2 hours before your slot at no charge"
    }
  ];
  res.json(faqs);
});

module.exports = router;