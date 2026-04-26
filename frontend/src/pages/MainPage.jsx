import React, { useEffect, useState } from 'react';
import { api } from '../api';

const TABS = [
  { id: 'reading', label: 'Читаю' },
  { id: 'finished', label: 'Прочитано' },
  { id: 'wishlist', label: 'Хочу прочитать' },
];

const stars = (rating) => rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : null;

export function MainPage({ activeTab, onTabChange, onOpenBook, onAddBook, onStats, refreshKey }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    api.getBooks(activeTab).then(setBooks);
  }, [activeTab, refreshKey]);

  return (
    <div className="page">
      <div className="header">
        <h1>📚 Дневник</h1>
        <button className="btn btn-secondary" onClick={onStats}>Статистика</button>
        <button className="btn btn-primary" onClick={onAddBook}>+ Книга</button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="book-list">
        {books.length === 0 && <p className="empty">Список пуст. Добавьте книгу голосом или кнопкой «+ Книга».</p>}
        {books.map(book => (
          <div key={book.id} className="book-card" onClick={() => onOpenBook(book.id)}>
            <h3>{book.title}</h3>
            <div className="author">{book.author}{book.genre ? ` · ${book.genre}` : ''}</div>
            <div className="meta">
              {book.rating && <span className="rating">{stars(book.rating)}</span>}
              {book.total_pages && <span>{book.current_page || 0} / {book.total_pages} стр.</span>}
            </div>
            {book.total_pages > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.round((book.current_page / book.total_pages) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
