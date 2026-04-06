require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');

const app = express();

app.use(cors());
app.use(express.json());

console.log('Starting server...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'set' : 'NOT SET');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
  res.send('JobPortal API is running');
});

const PORT = process.env.PORT || 5000;

// Try to connect to MongoDB, but start server anyway
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 4500,
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('⚠️ MongoDB connection failed:', err.message);
    console.log('⚠️ Server will run but data will not persist');
  });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
});
