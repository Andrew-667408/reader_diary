import React, { useState } from 'react';
import { api } from '../api';

export function AddNoteModal({ bookId, onClose, onSaved }) {
  const [form, setForm] = useState({ type: 'thought', content: '', page: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.content.trim()) return;
    await api.createNote(bookId, { ...form, page: form.page ? Math.floor(Number(form.page)) : undefined });
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Добавить заметку</h2>
        <div className="field">
          <label>Тип</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="thought">Мысль</option>
            <option value="quote">Цитата</option>
            <option value="summary">Вывод</option>
          </select>
        </div>
        <div className="field">
          <label>Содержание *</label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="Надиктуйте или напишите мысль…"
          />
        </div>
        <div className="field">
          <label>Страница</label>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.page} onChange={e => set('page', e.target.value.replace(/\D/g, ''))} placeholder="142" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={save}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}
