import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

export default api;
