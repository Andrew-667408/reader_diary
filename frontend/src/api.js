const BASE = 'http://localhost:3001/api';

const get = (url) => fetch(BASE + url).then(r => r.json());
const post = (url, body) => fetch(BASE + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
const patch = (url, body) => fetch(BASE + url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
const del = (url) => fetch(BASE + url, { method: 'DELETE' });

export const api = {
  getBooks: (status) => get('/books' + (status ? `?status=${status}` : '')),
  getBook: (id) => get(`/books/${id}`),
  createBook: (data) => post('/books', data),
  updateBook: (id, data) => patch(`/books/${id}`, data),
  deleteBook: (id) => del(`/books/${id}`),
  createNote: (bookId, data) => post(`/books/${bookId}/notes`, data),
  deleteNote: (id) => del(`/notes/${id}`),
  getStats: () => get('/stats'),
};
