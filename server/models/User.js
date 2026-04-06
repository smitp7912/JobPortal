const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['seeker', 'recruiter'],
    required: true
  },
  // For job seekers
  profile: {
    name: String,
    phone: String,
    location: String,
    education: [{
      institution: String,
      degree: String,
      year: String
    }],
    experience: [{
      company: String,
      position: String,
      duration: String,
      description: String
    }],
    skills: [String],
    resumeUri: String
  },
  // For recruiters
  companyName: String,
  companyDescription: String,
  // Simple token for authentication
  token: String,
  postedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  savedJobs: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
