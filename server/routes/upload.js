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

router.post('/resume', async (req, res) => {
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

    const { base64Data, fileName } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ message: 'No file data provided' });
    }

    const buffer = Buffer.from(base64Data.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }

    const publicId = `resumes/${user._id}_${Date.now()}`;

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    user.profile.resumeUrl = uploadResult.secure_url;
    user.profile.resumeFileName = fileName || 'resume.pdf';
    await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: uploadResult.secure_url,
      resumeFileName: fileName || 'resume.pdf'
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Error uploading resume', error: error.message });
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