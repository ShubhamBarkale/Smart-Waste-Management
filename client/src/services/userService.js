import api from './api';

export const getAllUsers = async (role = '', zone = '') => {
  const params = {};
  if (role) params.role = role;
  if (zone) params.zone = zone;
  const { data } = await api.get('/users', { params });
  return data;
};

export const getUserById = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

/**
 * Returns employees for a zone with isBusy flag and activeTasks attached.
 * zone: 'kopargaon' | 'shirdi'
 */
export const getEmployeeAvailability = async (zone) => {
  const { data } = await api.get(`/users/availability/${zone}`);
  return data;
};
