const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

router.get('/config', async (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    apiSecretSet: !!process.env.CLOUDINARY_API_SECRET
  });
});

router.post('/get-signed-url', async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const publicId = `resumes/${user._id}_${timestamp}`;
    
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      public_id: publicId,
      file: 'resume.pdf',
      resource_type: 'raw'
    }, process.env.CLOUDINARY_API_SECRET);

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload`
    });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ message: 'Error getting signed URL', error: error.message });
  }
});

router.post('/resume', async (req, res) => {
  try {
    if (!isDbConnected()) {
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

    const { resumeUrl, fileName } = req.body;
    
    if (!resumeUrl) {
      return res.status(400).json({ message: 'No resume URL provided' });
    }

    user.profile.resumeUrl = resumeUrl;
    user.profile.resumeFileName = fileName || 'resume.pdf';
    await user.save();

    res.json({
      message: 'Resume saved successfully',
      resumeUrl: user.profile.resumeUrl,
      resumeFileName: user.profile.resumeFileName
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ message: 'Error saving resume', error: error.message });
  }
});

router.delete('/resume', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected. Please try again later.' });
    }

    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.profile.resumeUrl) {
      const publicId = user.profile.resumeUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (e) {
        console.log('Cloudinary delete error (ignoring):', e.message);
      }

      user.profile.resumeUrl = undefined;
      user.profile.resumeFileName = undefined;
      await user.save();
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Error deleting resume', error: error.message });
  }
});

module.exports = router;