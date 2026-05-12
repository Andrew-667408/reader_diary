import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const PARTICLES = new Set([
  'в','во','на','с','со','к','ко','по','за','до','от','при','про','без',
  'для','под','над','перед','через','из','о','об','обо','у','и','или',
  'но','а','да','не','ни','же','ли','бы','то','как','что','это','со',
]);

const toTitleCase = (str) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map((w, i) =>
    (i > 0 && PARTICLES.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
};

const fetchBookInfo = async (title, signal) => {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`, { signal });
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

export function AddBookModal({ initialTitle = '', initialPages = '', onClose, onSaved }) {
  const [form, setForm] = useState({
    title: toTitleCase(initialTitle),
    author: '',
    genre: '',
    status: 'wishlist',
    total_pages: initialPages,
  });
  const [loading, setLoading] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const abortRef = useRef(null);

  const applyInfo = (info, signal) => {
    if (signal?.aborted) return;
    setLoading(false);
    if (info) {
      setLookupFailed(false);
      setForm(f => ({
        ...f,
        author: info.author || f.author,
        genre: info.genre || f.genre,
        total_pages: info.pages ? String(info.pages) : f.total_pages,
      }));
    } else {
      setLookupFailed(true);
    }
  };

  useEffect(() => {
    if (!initialTitle) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setLookupFailed(false);
    const cleanTitle = initialTitle.replace(/\s+(\d+|сто|двести|триста|четыреста|пятьсот|шестьсот|семьсот|восемьсот|девятьсот|тысяча|тысячи)\s*(страниц|страницы|страницу|стр)\.?\s*$/i, '').trim();
    fetchBookInfo(cleanTitle, ctrl.signal).then((info) => applyInfo(info, ctrl.signal));
    return () => ctrl.abort();
  }, [initialTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleBlur = async () => {
    if (!form.title.trim() || form.author) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setLookupFailed(false);
    const info = await fetchBookInfo(form.title, ctrl.signal);
    applyInfo(info, ctrl.signal);
  };

  const save = async () => {
    if (!form.title.trim() || !form.author.trim()) return;
    const totalPages = form.total_pages ? Math.floor(Number(form.total_pages)) : undefined;
    await api.createBook({
      ...form,
      title: toTitleCase(form.title.trim()),
      total_pages: totalPages,
      current_page: form.status === 'finished' && totalPages ? totalPages : undefined,
    }).catch(console.error);
    onSaved();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && form.title && form.author) save();
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
            onBlur={e => { set('title', toTitleCase(e.target.value.trim())); handleTitleBlur(); }}
            onKeyDown={handleKey}
            placeholder="Тихий Дон"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Автор *</label>
          <input
            value={form.author}
            onChange={e => set('author', e.target.value)}
            onKeyDown={handleKey}
            placeholder="Михаил Шолохов"
            autoComplete="off"
          />
          <span className="loading-hint">
            {loading ? 'Ищу информацию о книге…' : lookupFailed ? 'Не нашёл в базе — заполните вручную' : ''}
          </span>
        </div>
        <div className="field">
          <label>Жанр</label>
          <input
            value={form.genre}
            onChange={e => set('genre', e.target.value)}
            onKeyDown={handleKey}
            placeholder="Роман"
            autoComplete="off"
          />
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
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.total_pages}
            onChange={e => set('total_pages', e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKey}
            placeholder="720"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.title || !form.author}>Добавить</button>
        </div>
      </div>
    </div>
  );
}
