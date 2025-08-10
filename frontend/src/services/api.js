import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't redirect if it's a login request
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('auth', JSON.stringify({ email: response.data.email }));
        return { 
          success: true, 
          data: response.data 
        };
      }
      return { 
        success: false, 
        error: 'Login failed. No token received.' 
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
  },

  getCurrentUser: () => {
    const auth = localStorage.getItem('auth');
    return auth ? JSON.parse(auth) : null;
  }
};

export const patientService = {
  getAll: async () => {
    try {
      const response = await api.get('/patients');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch patients' };
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch patient' };
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/patients', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create patient' };
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/patients/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update patient' };
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete patient' };
    }
  },
  getLatestCode: async () => {
    try {
      const response = await api.get('/patients/latest-code');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch latest patient code' };
    }
  }
};

export const testService = {
  getAll: async () => {
    try {
      const response = await api.get('/tests');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch tests' };
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/tests/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch test' };
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/tests', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create test' };
    }
  },
  addResults: async (data) => {
    try {
      const response = await api.post('/test-results', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to add test results' };
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/tests/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update test' };
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/tests/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete test' };
    }
  },
  deleteResult: async (id) => {
    try {
      const response = await api.delete(`/test-results/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete test result' };
    }
  },
  getCategories: async () => {
    try {
      const response = await api.get('/tests/categories');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch test categories' };
    }
  },
  getCurrentDate: async () => {
    try {
      const response = await api.get('/current-date');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch current date' };
    }
  }
};

export const reportService = {
  generate: async (patientId, start, end) => {
    try {
      let url = `/reports/${patientId}`;
      if (start && end) {
        url += `?start=${start}&end=${end}`;
      }
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to generate report' };
    }
  },
  track: async (data) => {
    try {
      const response = await api.post('/reports/track', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to track report' };
    }
  },
  getCount: async () => {
    try {
      const response = await api.get('/reports/count');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch report count' };
    }
  },
  getRecent: async () => {
    try {
      const response = await api.get('/reports/recent');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch recent reports' };
    }
  }
};

export const labService = {
  getInfo: async () => {
    try {
      const response = await api.get('/lab-info');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch lab info' };
    }
  },
  updateInfo: async (data) => {
    try {
      const response = await api.put('/lab-info', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update lab info' };
    }
  },
  createInfo: async (data) => {
    try {
      const response = await api.post('/lab-info', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create lab info' };
    }
  }
};

export const doctorService = {
  getAll: async () => {
    try {
      const response = await api.get('/ref-doctors');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch doctors' };
    }
  },
  create: async (data) => {
    try {
      const response = await api.post('/ref-doctors', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create doctor' };
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/ref-doctors/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update doctor' };
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/ref-doctors/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete doctor' };
    }
  }
};

export const profileService = {
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch profile' };
    }
  },
  updateProfile: async (data) => {
    try {
      const response = await api.put('/profile', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  }
};

export const securityService = {
  changeEmail: async (data) => {
    try {
      const response = await api.post('/security/change-email', data);
      if (response.data.message === 'Email updated successfully') {
        // Get new token with updated email
        const tokenResponse = await api.post('/login', {
          email: data.newEmail,
          password: data.currentPassword
        });
        
        if (tokenResponse.data.token) {
          // Update stored token and auth data
          localStorage.setItem('token', tokenResponse.data.token);
          localStorage.setItem('auth', JSON.stringify({ email: data.newEmail }));
        }
      }
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to change email' };
    }
  },
  changePassword: async (data) => {
    try {
      const response = await api.post('/security/change-password', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to change password' };
    }
  }
};

export default api;