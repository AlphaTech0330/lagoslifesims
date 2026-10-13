import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Crucial to send refresh token HTTP-only cookies
});

// Attach current JWT Access Token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hustle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized errors & auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops on auth endpoints
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to request a new access token via HTTP-only refresh cookie
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.token;
        localStorage.setItem('hustle_token', newAccessToken);

        // Update failed request header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.warn('Session expired. Logging out user...');
        localStorage.removeItem('hustle_token');
        window.location.href = '/'; // Trigger clean reload to Auth screen
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;