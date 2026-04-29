const BASE = process.env.REACT_APP_API_URL || 'https://readerdiary-production.up.railway.app/api';

const handleResponse = (r) => {
  if (r.status === 204) return null;
  return r.json().then(data => {
    if (!r.ok) return Promise.reject(data);
    return data;
  });
};

const get = (url) => fetch(BASE + url).then(handleResponse);
const post = (url, body) => fetch(BASE + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse);
const patch = (url, body) => fetch(BASE + url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse);
const del = (url) => fetch(BASE + url, { method: 'DELETE' }).then(handleResponse);

export const api = {
  getBooks: (status) => get('/books' + (status ? `?status=${encodeURIComponent(status)}` : '')),
  getBook: (id) => get(`/books/${id}`),
  createBook: (data) => post('/books', data),
  updateBook: (id, data) => patch(`/books/${id}`, data),
  deleteBook: (id) => del(`/books/${id}`),
  createNote: (bookId, data) => post(`/books/${bookId}/notes`, data),
  deleteNote: (id) => del(`/notes/${id}`),
  getStats: () => get('/stats'),
  searchNotes: (query) => get(`/search?q=${encodeURIComponent(query)}`),
};
