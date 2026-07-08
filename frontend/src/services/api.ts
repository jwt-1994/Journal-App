import axios from 'axios';
import { isOnline } from './offlineStorage';

// 云端后端地址（部署后修改为实际域名）
const CLOUD_API_URL = 'https://api.sticker.example.com/api';

// 检测运行环境
const isCapacitorNative = (): boolean => {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// 环境判断：
// - Capacitor 原生 iOS：使用云端 API
// - Electron：使用本地 API
// - 开发模式：使用 Vite 代理
const baseURL = isCapacitorNative()
  ? CLOUD_API_URL
  : window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'
    : '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

// 请求拦截器：离线时使用缓存
api.interceptors.request.use(async (config) => {
  if (!isOnline()) {
    console.warn('[API] 离线模式，请求将失败');
  }
  return config;
});

// 响应拦截器：处理网络错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && !isOnline()) {
      console.warn('[API] 网络不可用');
    }
    return Promise.reject(error);
  }
);

// 分类
export const getCategories = () => api.get('/categories');
export const createCategory = (name: string) => api.post('/categories', null, { params: { name } });
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

// 素材
export const uploadMaterial = (file: File, categoryId: number, autoRemoveBg = true, name = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category_id', String(categoryId));
  formData.append('auto_remove_bg', String(autoRemoveBg));
  if (name) formData.append('name', name);
  return api.post('/materials/upload', formData);
};

export const uploadMaterialsBatch = (files: File[], categoryId: number, autoRemoveBg = true, name = '') => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('category_id', String(categoryId));
  formData.append('auto_remove_bg', String(autoRemoveBg));
  if (name) formData.append('name', name);
  return api.post('/materials/upload/batch', formData);
};

export const getMaterials = (params: {
  page?: number;
  page_size?: number;
  category_id?: number;
  search?: string;
  bg_status?: string;
  sort_by?: string;
  sort_order?: string;
}) => api.get('/materials', { params });

export const getMaterial = (id: number) => api.get(`/materials/${id}`);
export const getMaterialFileUrl = (id: number) => `${baseURL}/materials/${id}/file`;
export const getRemovedFileUrl = (id: number) => `${baseURL}/materials/${id}/removed-file`;
export const getRemovalStatus = (id: number) => api.get(`/materials/${id}/removal-status`);
export const retryRemoval = (id: number) => api.post(`/materials/${id}/retry-removal`);
export const deleteMaterial = (id: number) => api.delete(`/materials/${id}`);
export const batchRemoveBg = (ids: number[]) => api.post('/materials/batch-remove-bg', ids);
export const batchDelete = (ids: number[]) => api.post('/materials/batch-delete', ids);

// 报表
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDashboardRecent = (limit?: number) => api.get('/dashboard/recent', { params: { limit } });
export const getUploadTrend = (days?: number) => api.get('/dashboard/upload-trend', { params: { days } });

// 背景
export const getBackgrounds = (type?: string) => api.get('/backgrounds', { params: { type } });
export const createBackground = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/backgrounds', formData);
};
export const deleteBackground = (id: number) => api.delete(`/backgrounds/${id}`);
export const getBackgroundFileUrl = (id: number) => `${baseURL}/backgrounds/${id}/file`;

// 拼贴方案
export const getCollages = () => api.get('/collages');
export const getCollage = (id: number) => api.get(`/collages/${id}`);
export const createCollage = (data: {
  name: string;
  background_id?: number;
  canvas_width?: number;
  canvas_height?: number;
  layout_data?: unknown[];
}) => api.post('/collages', data);
export const updateCollage = (id: number, data: {
  name?: string;
  background_id?: number;
  layout_data?: unknown[];
  preview_path?: string;
}) => api.put(`/collages/${id}`, data);
export const deleteCollage = (id: number) => api.delete(`/collages/${id}`);
export const renameCollage = (id: number, name: string) => api.put(`/collages/${id}`, { name });

export default api;