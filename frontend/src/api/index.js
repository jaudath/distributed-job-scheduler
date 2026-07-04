import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: (name, email, password) => client.post('/auth/register', { name, email, password }),
  me: () => client.get('/auth/me')
};

export const projectApi = {
  list: () => client.get('/projects'),
  create: (payload) => client.post('/projects', payload),
  get: (id) => client.get(`/projects/${id}`),
  update: (id, payload) => client.put(`/projects/${id}`, payload),
  remove: (id) => client.delete(`/projects/${id}`)
};

export const queueApi = {
  list: (projectId) => client.get('/queues', { params: projectId ? { projectId } : {} }),
  create: (payload) => client.post('/queues', payload),
  get: (id) => client.get(`/queues/${id}`),
  update: (id, payload) => client.put(`/queues/${id}`, payload),
  setStatus: (id, status) => client.patch(`/queues/${id}/status`, { status }),
  remove: (id) => client.delete(`/queues/${id}`),
  stats: (id) => client.get(`/queues/${id}/stats`)
};

export const retryPolicyApi = {
  list: () => client.get('/retry-policies'),
  create: (payload) => client.post('/retry-policies', payload)
};

export const jobApi = {
  list: (params) => client.get('/jobs', { params }),
  create: (payload) => client.post('/jobs', payload),
  createBatch: (payload) => client.post('/jobs/batch', payload),
  get: (id) => client.get(`/jobs/${id}`),
  cancel: (id) => client.post(`/jobs/${id}/cancel`)
};

export const workerApi = {
  list: () => client.get('/workers'),
  get: (id) => client.get(`/workers/${id}`)
};

export const dlqApi = {
  list: (params) => client.get('/dlq', { params }),
  retry: (id) => client.post(`/dlq/${id}/retry`)
};

export const logApi = {
  list: (params) => client.get('/logs', { params })
};

export const statsApi = {
  system: () => client.get('/stats')
};
