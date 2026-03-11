import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ff_token');
    }
    return Promise.reject(error);
  }
);

// ── File Operations ────────────────────────

export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress?.(percentCompleted);
    },
  });
};

export const uploadMultipleFiles = (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  return api.post('/files/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress?.(percentCompleted);
    },
  });
};

export const downloadFile = async (fileId, filename) => {
  const response = await api.get(`/files/download/${fileId}`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteFile = (fileId) => api.delete(`/files/${fileId}`);

export const getFileStatus = (jobId) => api.get(`/jobs/${jobId}/status`);

// ── PDF Tools ─────────────────────────────

export const mergePDFs = (fileIds, outputName) =>
  api.post('/pdf/merge', { fileIds, outputName });

export const splitPDF = (fileId, pages) =>
  api.post('/pdf/split', { fileId, pages });

export const compressPDF = (fileId, quality = 'medium') =>
  api.post('/pdf/compress', { fileId, quality });

export const convertPDFToWord = (fileId) =>
  api.post('/pdf/to-word', { fileId });

export const convertWordToPDF = (fileId) =>
  api.post('/pdf/from-word', { fileId });

export const rotatePDF = (fileId, degrees, pages) =>
  api.post('/pdf/rotate', { fileId, degrees, pages });

export const addWatermark = (fileId, watermarkText, options) =>
  api.post('/pdf/watermark', { fileId, watermarkText, ...options });

export const extractPages = (fileId, pageRange) =>
  api.post('/pdf/extract-pages', { fileId, pageRange });

// ── Image Tools ───────────────────────────

export const convertImage = (fileId, targetFormat, options) =>
  api.post('/images/convert', { fileId, targetFormat, ...options });

export const resizeImage = (fileId, width, height, maintainAspect = true) =>
  api.post('/images/resize', { fileId, width, height, maintainAspect });

export const compressImage = (fileId, quality) =>
  api.post('/images/compress', { fileId, quality });

export const cropImage = (fileId, cropData) =>
  api.post('/images/crop', { fileId, ...cropData });

// ── Workflow ──────────────────────────────

export const createWorkflow = (workflow) =>
  api.post('/workflows', workflow);

export const getWorkflows = () =>
  api.get('/workflows');

export const runWorkflow = (workflowId, fileIds) =>
  api.post(`/workflows/${workflowId}/run`, { fileIds });

export const deleteWorkflow = (workflowId) =>
  api.delete(`/workflows/${workflowId}`);

// ── Tools ─────────────────────────────────

export const getTools = (category) =>
  api.get('/tools', { params: { category } });

export const getToolDetails = (toolId) =>
  api.get(`/tools/${toolId}`);

export default api;
