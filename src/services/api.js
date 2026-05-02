const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://jobportal-api-7p1p.onrender.com';

export const getJobId = (job) => job._id || job.id;

export const normalizeJob = (job) => ({
  ...job,
  id: getJobId(job),
});

export const api = {
  register: async (email, password, role, extraData = {}) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, ...extraData })
    });
    return response.json();
  },

  login: async (email, password, role) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return response.json();
  },

  logout: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token }
    });
    return response.json();
  },

  getMe: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  updateProfile: async (token, profile) => {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ profile })
    });
    return response.json();
  },

  getJobs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/jobs?${params}`);
    return response.json();
  },

  getJob: async (id) => {
    const response = await fetch(`${API_URL}/api/jobs/${id}`);
    return response.json();
  },

  createJob: async (token, jobData) => {
    const response = await fetch(`${API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify(jobData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    return data;
  },

  deleteJob: async (token, jobId) => {
    const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'token': token }
    });
    return response.json();
  },

  updateJob: async (token, jobId, jobData) => {
    const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify(jobData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    return data;
  },

  getMyJobs: async (token) => {
    const response = await fetch(`${API_URL}/api/jobs/my-jobs`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  getApplications: async (token, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/applications?${params}`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  applyJob: async (token, jobId) => {
    if (!jobId) {
      return { message: 'Invalid job ID', error: true };
    }
    try {
      const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'token': token 
        },
        body: JSON.stringify({ jobId })
      });
      return await response.json();
    } catch (error) {
      return { message: 'Network error', error: true };
    }
  },

  updateApplicationStatus: async (token, applicationId, status) => {
    const response = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    return data;
  },

  getSeekerProfile: async (token, seekerId) => {
    const response = await fetch(`${API_URL}/api/applications/seeker/${seekerId}`, {
      headers: { 'token': token }
    });
    return response.json();
},

  getApplicantResumeUrl: async (token, seekerId) => {
    const response = await fetch(`${API_URL}/api/applications/seeker/${seekerId}/resume-url`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  uploadResume: async (token, base64Data, fileName) => {
    try {
      // base64Data is a data URI like "data:application/pdf;base64,..."
      // Extract the base64 part after the comma
      const base64Part = base64Data.split(',')[1];
      
      const response = await fetch(`${API_URL}/api/upload/resume/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ fileData: base64Part, fileName })
      });

      const text = await response.text();
      
      if (!response.ok) {
        console.error('Upload failed with status:', response.status);
        console.error('Response text:', text);
        
        try {
          const errorJson = JSON.parse(text);
          console.error('Full error:', errorJson);
          return { message: errorJson.message || errorJson.error || `Upload failed (${response.status})` };
        } catch {
          return { message: `Server error: ${response.status}` };
        }
      }

      try {
        return JSON.parse(text);
      } catch {
        return { message: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { message: 'Network error: ' + error.message };
    }
  },

  deleteResume: async (token) => {
    const response = await fetch(`${API_URL}/api/upload/resume`, {
      method: 'DELETE',
      headers: { 'token': token }
    });
    return response.json();
  }
};

export default api;
