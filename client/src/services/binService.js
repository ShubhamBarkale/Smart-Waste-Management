import api from './api';

export const getAllBins = async (status = '') => {
  const params = status ? { status } : {};
  const { data } = await api.get('/bins', { params });
  return data;
};

export const getCriticalBins = async () => {
  const { data } = await api.get('/bins/critical');
  return data;
};

export const getBinById = async (binId) => {
  const { data } = await api.get(`/bins/${binId}`);
  return data;
};


// Staff correction (Bin Scanner page). The ESP32 uses /bins/update with its own API key instead.
export const manualUpdateBin = async (payload) => {
  const { data } = await api.post('/bins/manual-update', payload);
  return data;
};

export const getBinHistory = async (binId, hours = 24) => {
  const { data } = await api.get(`/bins/${binId}/history`, { params: { hours } });
  return data;
};
