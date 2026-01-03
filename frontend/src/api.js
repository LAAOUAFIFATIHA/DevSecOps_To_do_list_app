import axios from 'axios';

// Use dynamic base URL from environment or default to relative path
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401/422 Errors automatically
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
            // Token invalid or expired - logout user
            localStorage.removeItem('admin_token');
            if (!window.location.pathname.includes('/admin/login') && !window.location.pathname.includes('/stream/')) {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export const loginAdmin = (username, password) =>
    api.post('/admin/login', { username, password });

export const createStream = (name) =>
    api.post('/streams', { name });

export const getAllStreams = () =>
    api.get('/streams');

export const getStreamDetails = (streamId) =>
    api.get(`/streams/${streamId}`);

export const addTask = (streamId, name, description) =>
    api.post(`/streams/${streamId}/task`, { name, description });

export const voteTask = (taskId) =>
    api.put(`/tasks/${taskId}/vote`);

export const deleteTask = (taskId) =>
    api.delete(`/tasks/${taskId}`);

export const updateTaskStatus = (taskId, status) =>
    api.patch(`/tasks/${taskId}/status`, { status });

export const getConfig = () =>
    api.get('/config');

export default api;
