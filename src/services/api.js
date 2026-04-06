const API_URL = 'https://jobportal-api-7p1p.onrender.com';

// Helper to normalize MongoDB _id to id
export const getJobId = (job) => {
  return job._id || job.id;
};

export const normalizeJob = (job) => {
  return {
    ...job,
    id: getJobId(job),
  };
};

const getHeaders = () => {
  // For web
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const userData = localStorage.getItem('jobportal_user');
    if (userData) {
      const user = JSON.parse(userData);
      return { 'Content-Type': 'application/json', 'token': user.token };
    }
  }
  return { 'Content-Type': 'application/json' };
};

export const api = {
  // Auth
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

  // Jobs
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
    return response.json();
  },

  deleteJob: async (token, jobId) => {
    const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'token': token }
    });
    return response.json();
  },

  getMyJobs: async (token) => {
    const response = await fetch(`${API_URL}/api/jobs/my-jobs`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  // Applications
  getApplications: async (token, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/applications?${params}`, {
      headers: { 'token': token }
    });
    return response.json();
  },

  applyJob: async (token, jobId) => {
    const response = await fetch(`${API_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ jobId })
    });
    return response.json();
  },

  updateApplicationStatus: async (token, applicationId, status) => {
    const response = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  getSeekerProfile: async (token, seekerId) => {
    const response = await fetch(`${API_URL}/api/applications/seeker/${seekerId}`, {
      headers: { 'token': token }
    });
    return response.json();
  }
};

export default api;
