const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

// Configure multer for memory storage with larger limits
const upload = multer({ 
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  storage: multer.memoryStorage(),
  // Ensure we can parse multipart form data
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

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
      public_id: publicId
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

router.post('/resume/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== Upload Request Start ===');
    console.log('DB connected:', isDbConnected());
    
    if (!isDbConnected()) {
      console.error('DB not connected');
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { token } = req.headers;
    console.log('Token received:', token ? 'yes' : 'no');
    
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      console.error('Invalid token - user not found');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('User found:', user._id);
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file provided. Make sure to use multipart/form-data' });
    }

    console.log('File received:', req.file.originalname, req.file.size, 'bytes');

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const publicId = `resumes/${user._id}_${timestamp}`;

    // Convert buffer to data URI
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    console.log('Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw',
      public_id: publicId,
      format: 'pdf',
      use_filename: false,
      unique_filename: false,
    });

    console.log('Cloudinary upload success:', uploadResult.secure_url);

    user.profile.resumeUrl = uploadResult.secure_url;
    user.profile.resumeFileName = req.file.originalname || 'resume.pdf';
    await user.save();

    console.log('=== Upload Request End ===');
    
    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: uploadResult.secure_url,
      resumeFileName: req.file.originalname || 'resume.pdf'
    });
  } catch (error) {
    console.error('=== Upload Error ===');
    console.error('Error uploading resume:', error);
    console.error('Error stack:', error.stack);
    console.error('================');
    res.status(500).json({ message: 'Error uploading resume', error: error.message, stack: error.stack });
  }
});

router.get('/resume/url', async (req, res) => {
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

    if (!user.profile.resumeUrl) {
      return res.status(404).json({ message: 'No resume found' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const publicId = user.profile.resumeUrl
      .replace(`https://res.cloudinary.com/${cloudName}/raw/upload/`, '')
      .replace(`http://res.cloudinary.com/${cloudName}/raw/upload/`, '');

    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true
    });

    res.json({
      resumeUrl: signedUrl,
      resumeFileName: user.profile.resumeFileName
    });
  } catch (error) {
    console.error('Error getting resume URL:', error);
    res.status(500).json({ message: 'Error getting resume URL', error: error.message });
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