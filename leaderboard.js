const express = require('express');
const router = express.Router();
const User = require('../models/User'); // user modell

// GET /api/leaderboard/all - teljes ranglista lekérése
router.get('/all', async (req, res) => {
  try {
    // Példa: pontok szerint csökkenő sorrendben
    const users = await User.find().sort({ points: -1 }).limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
