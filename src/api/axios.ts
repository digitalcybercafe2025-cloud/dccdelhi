import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
    : (import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : 'https://dccdelhi.onrender.com');

const API_URL = `${API_BASE}/api`;

const api = axios.create({
    baseURL: API_URL, // Backend URL
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mangolpuri_admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
