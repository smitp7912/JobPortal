const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Helper to verify token
async function verifyToken(token) {
  if (!isDbConnected()) return null;
  return await User.findOne({ token });
}

// Get applications
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    const { jobId, seekerId } = req.query;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = {};

    // Seekers can see their own applications
    if (user.role === 'seeker') {
      query.seekerId = user._id;
    } 
    // Recruiters can see applications for their jobs
    else if (user.role === 'recruiter') {
      const myJobs = await Job.find({ recruiterId: user._id }).select('_id');
      const jobIds = myJobs.map(j => j._id);
      query.jobId = { $in: jobIds };
    }

    if (jobId) {
      query.jobId = jobId;
    }

    if (seekerId) {
      query.seekerId = seekerId;
    }

    const applications = await Application.find(query)
      .populate('jobId')
      .sort({ appliedDate: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Apply for job
router.post('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    const { jobId } = req.body;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can apply for jobs' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      seekerId: user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Create application
    const application = new Application({
      jobId,
      seekerId: user._id,
      recruiterId: job.recruiterId,
      seekerName: user.profile?.name || user.email,
      seekerEmail: user.email
    });

    await application.save();

    // Add seeker to job applicants
    job.applicants.push(user._id);
    await job.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
});

// Update application status (recruiter only)
router.put('/:id/status', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    const { status } = req.body;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can update status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify recruiter owns the job
    if (application.recruiterId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    application.status = status;
    await application.save();

    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Get seeker profile (for recruiter)
router.get('/seeker/:seekerId', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const seeker = await User.findById(req.params.seekerId);
    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    res.json({
      profile: seeker.profile,
      email: seeker.email
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seeker profile', error: error.message });
  }
});

module.exports = router;
