import axios from 'axios';

// Configure your backend URL here
const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Add a request interceptor to attach the JWT token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
