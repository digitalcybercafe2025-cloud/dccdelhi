import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
    : (import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : 'https://dccdelhi.onrender.com');

export const getMediaUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
        return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${cleanUrl}`;
};

const API_URL = `${API_BASE}/api`;

const api = axios.create({
    baseURL: API_URL, // Backend URL
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add the auth token and ensure proper multipart headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mangolpuri_admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // When sending FormData, delete explicit Content-Type so Axios & browser can set multipart boundary
        if (config.data instanceof FormData && config.headers) {
            if (typeof (config.headers as any).delete === 'function') {
                (config.headers as any).delete('Content-Type');
                (config.headers as any).delete('content-type');
            } else {
                delete (config.headers as any)['Content-Type'];
                delete (config.headers as any)['content-type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
