const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const KEYS = {
  USER: '@jobportal_user',
  JOBS: '@jobportal_jobs',
  APPLICATIONS: '@jobportal_applications',
};

const localStorageCache: { [key: string]: any } = {};

const loadFromLocalStorage = () => {
  try {
    Object.keys(KEYS).forEach((key) => {
      const value = localStorage.getItem(KEYS[key as keyof typeof KEYS]);
      localStorageCache[key] = value ? JSON.parse(value) : null;
    });
  } catch (e) {
  }
};

if (isWeb) {
  loadFromLocalStorage();
}

export const Storage = {
  async getUser() {
    if (isWeb) {
      return localStorageCache.USER || null;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any) {
    if (isWeb) {
      localStorageCache.USER = user;
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async clearUser() {
    if (isWeb) {
      localStorageCache.USER = null;
      localStorage.removeItem(KEYS.USER);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async getJobs() {
    if (isWeb) {
      return localStorageCache.JOBS || null;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const data = await AsyncStorage.getItem(KEYS.JOBS);
    return data ? JSON.parse(data) : null;
  },

  async setJobs(jobs: any[]) {
    if (isWeb) {
      localStorageCache.JOBS = jobs;
      localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
  },

  async getApplications() {
    if (isWeb) {
      return localStorageCache.APPLICATIONS || null;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const data = await AsyncStorage.getItem(KEYS.APPLICATIONS);
    return data ? JSON.parse(data) : null;
  },

  async setApplications(applications: any[]) {
    if (isWeb) {
      localStorageCache.APPLICATIONS = applications;
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(applications));
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(applications));
  },

  async clearAll() {
    if (isWeb) {
      localStorageCache.USER = null;
      localStorageCache.JOBS = null;
      localStorageCache.APPLICATIONS = null;
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.JOBS);
      localStorage.removeItem(KEYS.APPLICATIONS);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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