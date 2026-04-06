const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// Get all jobs with filters
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const jobs = [];
      return res.json(jobs);
    }
    
    const { search, category, jobType, salary } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (jobType) {
      query.jobType = jobType;
    }

    const jobs = await Job.find(query).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Create job (recruiter only)
router.post('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can post jobs' });
    }

    const job = new Job({
      recruiterId: user._id,
      ...req.body
    });

    await job.save();

    // Add to user's posted jobs
    user.postedJobs.push(job._id);
    await user.save();

    res.status(201).json({
      message: 'Job posted successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Update job (recruiter only)
router.put('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const job = await Job.findOne({ _id: req.params.id, recruiterId: user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    Object.assign(job, req.body);
    await job.save();

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
});

// Delete job (recruiter only)
router.delete('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiterId: user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

// Get recruiter's jobs
router.get('/my-jobs', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const { token } = req.headers;
    
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const jobs = await Job.find({ recruiterId: user._id }).sort({ postedDate: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

module.exports = router;
