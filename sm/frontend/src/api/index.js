import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sm_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && window.location.pathname !== '/login') {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;

export const errMsg = e => e?.response?.data?.message || e?.message || 'Something went wrong';

// ── Auth ──────────────────────────
export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
  me:       () => api.get('/auth/me'),
  changePw: d => api.put('/auth/password', d),
};

// ── Users ──────────────────────────
export const userAPI = {
  get:          id  => api.get(`/users/${id}`),
  update:       d   => api.put('/users/profile', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  follow:       id  => api.post(`/users/${id}/follow`),
  unfollow:     id  => api.delete(`/users/${id}/follow`),
  followers:    id  => api.get(`/users/${id}/followers`),
  following:    id  => api.get(`/users/${id}/following`),
  suggestions:  ()  => api.get('/users/suggestions'),
  search:       q   => api.get('/users/search', { params: { q } }),
};

// ── Posts ──────────────────────────
export const postAPI = {
  feed:       p  => api.get('/posts/feed', { params: p }),
  explore:    p  => api.get('/posts/explore', { params: p }),
  userPosts:  id => api.get(`/posts/user/${id}`),
  create:     d  => api.post('/posts', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:     id => api.delete(`/posts/${id}`),
  react:      (id, type) => api.post(`/posts/${id}/react`, { type }),
  share:      (id, comment) => api.post(`/posts/${id}/share`, { comment }),
  comments:   id => api.get(`/posts/${id}/comments`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
};

// ── Services ──────────────────────────
export const svcAPI = {
  getAll:      p   => api.get('/services', { params: p }),
  trending:    ()  => api.get('/services/trending'),
  categories:  ()  => api.get('/services/categories'),
  byUser:      id  => api.get(`/services/user/${id}`),
  get:         id  => api.get(`/services/${id}`),
  create:      d   => api.post('/services', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:      (id,d) => api.put(`/services/${id}`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:      id  => api.delete(`/services/${id}`),
  reviews:     id  => api.get(`/reviews/${id}`),
  addReview:   (id,d) => api.post(`/reviews/${id}`, d),
  delReview:   id  => api.delete(`/reviews/del/${id}`),
};

// ── Notifications ──────────────────────────
export const notifAPI = {
  getAll:   () => api.get('/notifications'),
  readAll:  () => api.put('/notifications/read-all'),
  readOne:  id => api.put(`/notifications/${id}/read`),
};

// ── Messages ──────────────────────────
export const msgAPI = {
  convs:    ()       => api.get('/messages'),
  start:    rid      => api.post('/messages', { recipientId: rid }),
  messages: id       => api.get(`/messages/${id}`),
  send:     (id, c)  => api.post(`/messages/${id}`, { content: c }),
};

// ── Search ──────────────────────────
export const searchAPI = { search: q => api.get('/search', { params: { q } }) };

// ── Admin ──────────────────────────
export const adminAPI = {
  stats:          ()  => api.get('/admin/stats'),
  users:          ()  => api.get('/admin/users'),
  toggleUser:     id  => api.put(`/admin/users/${id}/toggle`),
  posts:          ()  => api.get('/admin/posts'),
  removePost:     id  => api.delete(`/admin/posts/${id}`),
  services:       ()  => api.get('/admin/services'),
  toggleFeatured: id  => api.put(`/admin/services/${id}/feature`),
};
