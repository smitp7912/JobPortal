const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const User = require('../models/User');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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

// Helper function for stream upload (preserves PDF integrity)
const uploadStream = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    
    Readable.from(buffer).pipe(stream);
  });
};

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
    const publicId = `resumes/${user._id}_${timestamp}.pdf`;
    
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
    
    if (!isDbConnected()) {
      console.error('DB not connected');
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { token } = req.headers;
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      console.error('Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('User:', user._id);

    if (!req.file) {
      console.error('No file provided');
      return res.status(400).json({ message: 'No file provided' });
    }

    console.log('File:', req.file.originalname, req.file.size, 'bytes');

    // Validate file is PDF
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const publicId = `resumes/${user._id}_${timestamp}.pdf`;

    // Use stream upload (preserves PDF binary integrity)
    console.log('Uploading to Cloudinary via stream...');
    
    const uploadResult = await uploadStream(req.file.buffer, {
      resource_type: 'raw',
      public_id: publicId,
      type: 'upload',
      use_filename: false,
      unique_filename: false,
    });

    console.log('Cloudinary success:', uploadResult.secure_url);
    console.log('File type:', uploadResult.type);

    user.profile.resumeUrl = uploadResult.secure_url;
    user.profile.resumeFileName = req.file.originalname || 'resume.pdf';
    await user.save();

    console.log('=== Upload Complete ===');
    
    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: uploadResult.secure_url,
      resumeFileName: req.file.originalname || 'resume.pdf'
    });
  } catch (error) {
    console.error('=== Upload Error ===');
    console.error(error);
    res.status(500).json({ message: 'Error uploading resume', error: error.message });
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

    // For viewing, use unsigned URL (no download restrictions)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let displayUrl = user.profile.resumeUrl;

    // Handle PDFs stored with image/upload path (legacy/broken uploads)
    if (displayUrl.includes('/image/upload/') && displayUrl.toLowerCase().endsWith('.pdf')) {
      const publicId = displayUrl
        .replace(`https://res.cloudinary.com/${cloudName}/image/upload/`, '')
        .replace(`http://res.cloudinary.com/${cloudName}/image/upload/`, '')
        .replace(/^v\d+\//, '') // Remove version number
        .split('?')[0];

      // Use raw resource type for PDF
      displayUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        sign_url: false,
        secure: true
      });
    }

    res.json({
      resumeUrl: displayUrl,
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