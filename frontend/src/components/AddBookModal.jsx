import React, { useState, useEffect } from 'react';
import { api } from '../api';

const fetchBookInfo = async (title) => {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    const book = data.docs?.[0];
    if (!book) return null;
    return {
      author: book.author_name?.[0] || '',
      pages: book.number_of_pages_median || '',
      genre: book.subject?.[0] || '',
    };
  } catch {
    return null;
  }
};

export function AddBookModal({ initialTitle = '', onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initialTitle,
    author: '',
    genre: '',
    status: 'wishlist',
    total_pages: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialTitle) return;
    setLoading(true);
    fetchBookInfo(initialTitle).then((info) => {
      if (info) setForm(f => ({
        ...f,
        author: info.author || f.author,
        genre: info.genre || f.genre,
        total_pages: info.pages ? String(info.pages) : f.total_pages,
      }));
      setLoading(false);
    });
  }, [initialTitle]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleBlur = async () => {
    if (!form.title.trim() || form.author) return;
    setLoading(true);
    const info = await fetchBookInfo(form.title);
    if (info) setForm(f => ({
      ...f,
      author: info.author || f.author,
      genre: info.genre || f.genre,
      total_pages: info.pages ? String(info.pages) : f.total_pages,
    }));
    setLoading(false);
  };

  const save = async () => {
    if (!form.title.trim() || !form.author.trim()) return;
    await api.createBook({ ...form, total_pages: form.total_pages ? Number(form.total_pages) : undefined });
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Добавить книгу</h2>
        <div className="field">
          <label>Название *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Тихий Дон"
          />
        </div>
        <div className="field">
          <label>Автор *</label>
          <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="Михаил Шолохов" />
          {loading && <span className="loading-hint">Ищу информацию о книге…</span>}
        </div>
        <div className="field">
          <label>Жанр</label>
          <input value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="Роман" />
        </div>
        <div className="field">
          <label>Статус</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="wishlist">Хочу прочитать</option>
            <option value="reading">Читаю</option>
            <option value="finished">Прочитал</option>
          </select>
        </div>
        <div className="field">
          <label>Страниц</label>
          <input type="number" value={form.total_pages} onChange={e => set('total_pages', e.target.value)} placeholder="720" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.title || !form.author}>Добавить</button>
        </div>
      </div>
    </div>
  );
}
