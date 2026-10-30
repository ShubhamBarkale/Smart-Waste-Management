import api from './api';

export const getAllTasks = async (status = '') => {
  const params = status ? { status } : {};
  const { data } = await api.get('/tasks', { params });
  return data;
};

export const getTaskById = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}`);
  return data;
};

export const createTask = async (payload) => {
  const { data } = await api.post('/tasks', payload);
  return data;
};

export const assignTask = async (taskId, employeeId) => {
  const { data } = await api.patch(`/tasks/${taskId}/assign`, { employeeId });
  return data;
};

export const updateTaskStatus = async (taskId, status) => {
  const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
  return data;
};
