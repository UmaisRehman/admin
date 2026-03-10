import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add access token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 403 → refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
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

// ============ AUTH ============
export const authAPI = {
    login: (email: string, password?: string) =>
        api.post('/auth/login', { email, password }),
    verifyOTP: (email: string, otp: string) =>
        api.post('/auth/verify-otp', { email, otp }),
    logout: () => api.post('/auth/logout'),
    checkAuth: () => api.get('/auth/check'),
    updatePassword: (newPassword: string) =>
        api.put('/auth/password', { newPassword }),
};

// ============ PROJECTS ============
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

// ============ PROFILE ============
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
