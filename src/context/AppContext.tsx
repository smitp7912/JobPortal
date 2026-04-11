import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import api, { getJobId } from '../services/api';

export type UserRole = 'seeker' | 'recruiter';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: any;
  companyName?: string;
  token?: string;
}

export interface Job {
  _id: string;
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  location?: string;
  salary?: string;
  category?: string;
  jobType?: string;
  requirements?: string[];
  postedDate?: string;
  applicants?: string[];
}

interface Application {
  _id: string;
  id?: string;
  jobId: Job | string;
  seekerId: string;
  recruiterId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  seekerName?: string;
  seekerEmail?: string;
}

interface AppContextType {
  user: User | null;
  jobs: Job[];
  applications: Application[];
  isLoading: boolean;
  isBackendConnected: boolean;
  login: (email: string, password: string, role: 'seeker' | 'recruiter') => Promise<boolean>;
  register: (email: string, password: string, role: 'seeker' | 'recruiter', extraData?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: () => void;
  updateProfile: (profile: any) => Promise<void>;
  postJob: (job: Omit<Job, '_id' | 'id' | 'recruiterId' | 'postedDate' | 'applicants'>) => Promise<void>;
  applyForJob: (jobId: string) => Promise<any>;
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected') => Promise<void>;
  getApplicantProfile: (seekerId: string) => any;
  deleteJob: (jobId: string) => Promise<void>;
  saveJob: (jobId: string) => Promise<void>;
  getSavedJobs: () => Job[];
  refreshJobs: () => Promise<void>;
  refreshApplications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const getStoredUser = (): User | null => {
  if (isWeb) {
    const data = localStorage.getItem('jobportal_user');
    return data ? JSON.parse(data) : null;
  }
  return null;
};

const storeUser = (user: User | null) => {
  if (isWeb) {
    if (user) {
      localStorage.setItem('jobportal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jobportal_user');
    }
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const storedUser = getStoredUser();
      if (storedUser && storedUser.token) {
        setUser(storedUser);
        
        const meResponse = await api.getMe(storedUser.token);
        if (meResponse.user) {
          setUser({ ...storedUser, ...meResponse.user });
          
          // Pre-load applications for recruiters
          if (storedUser.role === 'recruiter') {
            const appsResponse = await api.getApplications(storedUser.token);
            if (Array.isArray(appsResponse)) {
              setApplications(appsResponse);
            }
          } else {
            const appsResponse = await api.getApplications(storedUser.token);
            if (Array.isArray(appsResponse)) {
              setApplications(appsResponse);
            }
          }
        }
      }

      const jobsResponse = await api.getJobs();
      if (Array.isArray(jobsResponse)) {
        const normalizedJobs = jobsResponse.map(job => ({
          ...job,
          id: getJobId(job)
        }));
        setJobs(normalizedJobs);
        setIsBackendConnected(true);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = useCallback(async () => {
    try {
      const response = await api.getJobs();
      if (Array.isArray(response)) {
        const normalizedJobs = response.map(job => ({
          ...job,
          id: getJobId(job)
        }));
        setJobs(normalizedJobs);
      }
    } catch (error) {
      console.error('Error refreshing jobs:', error);
    }
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await api.getApplications(user.token);
      if (Array.isArray(response)) {
        setApplications(response);
      }
    } catch (error) {
      console.error('Error refreshing applications:', error);
    }
  }, [user?.token]);

  const login = async (email: string, password: string, role: 'seeker' | 'recruiter'): Promise<boolean> => {
    try {
      const response = await api.login(email, password, role);
      
      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          profile: response.user.profile,
          companyName: response.user.companyName,
          token: response.user.token
        };
        
        setUser(userData);
        storeUser(userData);
        
        const jobsResponse = await api.getJobs();
        if (Array.isArray(jobsResponse)) {
          const normalizedJobs = jobsResponse.map(job => ({
            ...job,
            id: getJobId(job)
          }));
          setJobs(normalizedJobs);
        }
        
        // Pre-load applications for both seekers and recruiters
        if (userData.token) {
          const appsResponse = await api.getApplications(userData.token);
          if (Array.isArray(appsResponse)) {
            setApplications(appsResponse);
          }
        }
        
        setIsBackendConnected(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, role: 'seeker' | 'recruiter', extraData?: any): Promise<boolean> => {
    try {
      const response = await api.register(email, password, role, extraData);
      
      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          profile: response.user.profile,
          companyName: response.user.companyName,
          token: response.user.token
        };
        
        setUser(userData);
        storeUser(userData);
        
        const jobsResponse = await api.getJobs();
        if (Array.isArray(jobsResponse)) {
          const normalizedJobs = jobsResponse.map(job => ({
            ...job,
            id: getJobId(job)
          }));
          setJobs(normalizedJobs);
        }
        
        await refreshApplications();
        
        setIsBackendConnected(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.token) {
        await api.logout(user.token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setJobs([]);
      setApplications([]);
      storeUser(null);
      
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const switchRole = () => {
    // Not supported with backend - users need to logout and login with different role
    // But we'll update the stored user role temporarily
    if (user) {
      const newRole: UserRole = user.role === 'seeker' ? 'recruiter' : 'seeker';
      const updatedUser: User = { ...user, role: newRole };
      setUser(updatedUser);
      storeUser(updatedUser);
    }
  };

  const updateProfile = async (profile: any) => {
    if (!user?.token) return;
    
    try {
      const response = await api.updateProfile(user.token, profile);
      if (response.user) {
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        storeUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const postJob = async (jobData: Omit<Job, '_id' | 'id' | 'recruiterId' | 'postedDate' | 'applicants'>) => {
    if (!user?.token) return;
    
    try {
      const response = await api.createJob(user.token, {
        ...jobData,
        companyLogo: jobData.companyLogo || `https://via.placeholder.com/100/2563EB/FFFFFF?text=${jobData.company.charAt(0)}`
      });
      
      if (response.job) {
        setJobs([response.job, ...jobs]);
      }
    } catch (error) {
      console.error('Error posting job:', error);
    }
  };

  const applyForJob = async (jobId: string) => {
    if (!user?.token) {
      return { message: 'Please login first', error: true };
    }
    
    try {
      const response = await api.applyJob(user.token, jobId);
      
      if (response.message === 'Invalid token' || response.message === 'Unauthorized') {
        setUser(null);
        storeUser(null);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return { message: 'Session expired', error: true };
      }
      
      if (!response.error && !response.message?.includes('already')) {
        setApplications(prev => [...prev, response.application]);
      }
      
      return response;
    } catch (error) {
      console.error('Error applying for job:', error);
      return { message: 'Network error', error: true };
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!user?.token) return;
    
    try {
      const response = await api.updateApplicationStatus(user.token, applicationId, status);
      
      if (!response.error) {
        setApplications(prev => 
          prev.map(app => app._id === applicationId ? { ...app, status } : app)
        );
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const getApplicantProfile = useCallback(async (seekerId: string) => {
    if (!user?.token) return null;
    
    try {
      const response = await api.getSeekerProfile(user.token, seekerId);
      return response;
    } catch (error) {
      console.error('Error getting applicant profile:', error);
      return null;
    }
  }, [user?.token]);

  const deleteJob = async (jobId: string) => {
    if (!user?.token) return;
    
    try {
      await api.deleteJob(user.token, jobId);
      setJobs(jobs.filter(j => j._id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const saveJob = async (jobId: string) => {
    if (!user?.token || !jobId) return;
    
    const currentSaved = user.profile?.savedJobs || [];
    const isAlreadySaved = currentSaved.includes(jobId);
    
    let newSavedList;
    if (isAlreadySaved) {
      newSavedList = currentSaved.filter((id: string) => id !== jobId);
    } else {
      newSavedList = [...currentSaved, jobId];
    }
    
    const newProfile = { ...user.profile, savedJobs: newSavedList };
    const newUser = { ...user, profile: newProfile };
    setUser(newUser);
    storeUser(newUser);
    
    try {
      await api.updateProfile(user.token, newProfile);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const getSavedJobs = (): Job[] => {
    const savedJobIds = user?.profile?.savedJobs || [];
    return jobs.filter(job => savedJobIds.includes(job.id));
  };

  const contextValue = useMemo(() => ({
    user,
    jobs,
    applications,
    isLoading,
    isBackendConnected,
    login,
    register,
    logout,
    switchRole,
    updateProfile,
    postJob,
    applyForJob,
    updateApplicationStatus,
    getApplicantProfile,
    deleteJob,
    saveJob,
    getSavedJobs,
    refreshJobs,
    refreshApplications,
  }), [
    user,
    jobs,
    applications,
    isLoading,
    isBackendConnected,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
