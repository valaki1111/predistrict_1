const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { runCronJobs } = require('./cron');

const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/league');
const questionRoutes = require('./routes/questions');
const leaderboardRoutes = require('./routes/leaderboard');
const answersRoutes = require('./routes/answers');
const telegramRoutes = require('./routes/telegram'); // ÚJ

const app = express();

// FONTOS: Render a PORT környezeti változót használja
const PORT = process.env.PORT || 3000;

// MongoDB URI a környezeti változóból
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/predistrict';

// Csatlakozás MongoDB-hez
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/answers', answersRoutes);
app.use('/api/telegram', telegramRoutes); // ÚJ

runCronJobs();

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

// Indítás
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
