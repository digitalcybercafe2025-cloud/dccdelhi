import axios from 'axios';

const IS_DEV = import.meta.env.DEV;
const API_URL = IS_DEV
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : '/api'; // Adjust for production if necessary

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
