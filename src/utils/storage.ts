import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@jobportal_user',
  JOBS: '@jobportal_jobs',
  APPLICATIONS: '@jobportal_applications',
};

export const Storage = {
  async getUser() {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async clearUser() {
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async getJobs() {
    const data = await AsyncStorage.getItem(KEYS.JOBS);
    return data ? JSON.parse(data) : null;
  },

  async setJobs(jobs: any[]) {
    await AsyncStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
  },

  async getApplications() {
    const data = await AsyncStorage.getItem(KEYS.APPLICATIONS);
    return data ? JSON.parse(data) : null;
  },

  async setApplications(applications: any[]) {
    await AsyncStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(applications));
  },

  async clearAll() {
    await AsyncStorage.removeItem(KEYS.USER);
    await AsyncStorage.removeItem(KEYS.JOBS);
    await AsyncStorage.removeItem(KEYS.APPLICATIONS);
  },
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};