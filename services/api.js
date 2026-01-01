import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// User API - Updated for serverless
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStudentsByClass: (classId) => api.get('/users', { params: { classId } }),
};

// Class API - Updated for serverless
export const classAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getSubjects: (id) => api.get(`/classes/${id}/subjects`),
  getAllAssignments: () => api.get('/classes/assignments/all'),
};

// Subject API - Updated for serverless
export const subjectAPI = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Exam API - Updated for serverless
export const examAPI = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  getByClass: (classId) => api.get('/exams', { params: { classId } }),
};

// Mark API - Updated for serverless
export const markAPI = {
  getAll: () => api.get('/marks'),
  getByExam: (examId) => api.get('/marks', { params: { examId } }),
  getByStudent: (studentId) => api.get('/marks', { params: { studentId } }),
  getByStudentAndExam: (studentId, examId) => api.get('/marks', { params: { studentId, examId } }),
  create: (data) => api.post('/marks', data),
  update: (id, data) => api.put(`/marks/${id}`, data),
  delete: (id) => api.delete(`/marks/${id}`),
  analyze: (id) => api.post(`/marks/${id}/analyze`),
};

// Attendance API
export const attendanceAPI = {
  getAll: () => api.get('/attendance'),
  upsert: (data) => api.post('/attendance', data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// Grade API
export const gradeAPI = {
  getAll: () => api.get('/grades'),
  getById: (id) => api.get(`/grades/${id}`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`),
};

// School API
export const schoolAPI = {
  get: () => api.get('/school'),
  update: (data) => api.put('/school', data),
};

export default api;
