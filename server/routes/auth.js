const express = require('express');
const router = express.Router();
const User = require('../models/User');

const DB_CONNECTED = require('mongoose').connection.readyState === 1;

// Generate simple token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Register
router.post('/register', async (req, res) => {
  try {
    if (!DB_CONNECTED) {
      return res.status(503).json({ message: 'Database not connected. Please try again later.' });
    }
    
    const { email, password, role, companyName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      companyName: role === 'recruiter' ? companyName : undefined,
      profile: role === 'seeker' ? {
        name: '',
        phone: '',
        location: '',
        education: [],
        experience: [],
        skills: [],
        resumeUri: null
      } : undefined
    });

    // Generate token
    user.token = generateToken();

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profile: user.profile,
        token: user.token
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    if (!DB_CONNECTED) {
      return res.status(503).json({ message: 'Database not connected. Please try again later.' });
    }
    
    const { email, password, role } = req.body;

    // Find user
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate new token
    user.token = generateToken();
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profile: user.profile,
        token: user.token
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get user by token
router.get('/me', async (req, res) => {
  try {
    if (!DB_CONNECTED) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profile: user.profile,
        token: user.token
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting user', error: error.message });
  }
});

// Update profile (for seekers)
router.put('/profile', async (req, res) => {
  try {
    if (!DB_CONNECTED) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    const { profile } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    user.profile = { ...user.profile, ...profile };
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        profile: user.profile,
        token: user.token
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    if (!DB_CONNECTED) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (user) {
      user.token = null;
      await user.save();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
});

module.exports = router;
