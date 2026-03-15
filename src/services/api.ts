import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            error.friendlyMessage = 'Cannot connect to server. Please check if the backend is running.';
            return Promise.reject(error);
        }

        const originalRequest = error.config;
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
                localStorage.setItem('accessToken', data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const getErrorMessage = (error: any): string => {
    if (error.friendlyMessage) return error.friendlyMessage;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message === 'Network Error') return 'Cannot connect to server. Please check if the backend is running.';
    return 'Something went wrong. Please try again.';
};

export const authAPI = {
    signup: (data: { name: string; username: string; email: string; password: string }) =>
        api.post('/auth/signup', data),
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),
    resetPassword: (email: string, otp: string, newPassword: string) =>
        api.post('/auth/reset-password', { email, otp, newPassword }),
    logout: () => api.post('/auth/logout'),
    checkAuth: () => api.get('/auth/check'),
    updatePassword: (currentPassword: string, newPassword: string) =>
        api.put('/auth/password', { currentPassword, newPassword }),
    updateUsername: (username: string) =>
        api.put('/auth/username', { username }),
};

export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getById: (id: string) => api.get(`/projects/${id}`),
    create: (formData: FormData) =>
        api.post('/projects', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    update: (id: string, formData: FormData) =>
        api.put(`/projects/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    delete: (id: string) => api.delete(`/projects/${id}`),
};

export const profileAPI = {
    get: () => api.get('/profile'),
    update: (formData: FormData) =>
        api.put('/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    uploadResume: (formData: FormData) =>
        api.post('/profile/resume', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

export default api;
