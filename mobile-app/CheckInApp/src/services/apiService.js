import axios from 'axios';

// Replace with your Django server URL
const BASE_URL = 'http://192.168.1.100:8000'; // Change this to your local IP

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  async login(email, password) {
    try {
      const response = await this.api.post('/api/mobile/login/', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async logout() {
    try {
      await this.api.post('/api/mobile/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile() {
    try {
      const response = await this.api.get('/api/mobile/profile/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  }

  async getLocations() {
    try {
      const response = await this.api.get('/api/mobile/locations/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get locations');
    }
  }

  async getActiveCheckIn() {
    try {
      const response = await this.api.get('/api/mobile/active-checkin/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get active check-in');
    }
  }

  async getCheckInHistory() {
    try {
      const response = await this.api.get('/api/mobile/checkin-history/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get check-in history');
    }
  }

  async checkIn(locationId, latitude, longitude) {
    try {
      const response = await this.api.post('/api/mobile/checkin/', {
        location_id: locationId,
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Check-in failed');
    }
  }

  async checkOut(latitude, longitude) {
    try {
      const response = await this.api.post('/api/mobile/checkout/', {
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Check-out failed');
    }
  }

  // Admin APIs
  async getAdminDashboardStats() {
    try {
      const response = await this.api.get('/api/mobile/admin/dashboard-stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get dashboard stats');
    }
  }

  async getAdminCheckIns() {
    try {
      const response = await this.api.get('/api/mobile/admin/checkins/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get check-ins');
    }
  }

  async getAdminEmployees() {
    try {
      const response = await this.api.get('/api/mobile/admin/employees/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get employees');
    }
  }

  async getAdminLocations() {
    try {
      const response = await this.api.get('/api/mobile/admin/locations/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get locations');
    }
  }
}

export const apiService = new ApiService();