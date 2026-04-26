import React, { useEffect, useState } from 'react';
import { api } from '../api';

const NOTE_TYPES = { thought: 'Мысль', quote: 'Цитата', summary: 'Вывод' };
const stars = (r) => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '—';

export function BookPage({ bookId, onBack, onAddNote, onRefresh, refreshKey }) {
  const [book, setBook] = useState(null);

  useEffect(() => {
    api.getBook(bookId).then(setBook);
  }, [bookId, refreshKey]);

  if (!book) return <div className="page"><p className="empty">Загрузка…</p></div>;

  const finishBook = async () => {
    await api.updateBook(book.id, { status: 'finished' });
    onRefresh();
  };

  const startReading = async () => {
    await api.updateBook(book.id, { status: 'reading' });
    onRefresh();
  };

  const deleteNote = async (noteId) => {
    await api.deleteNote(noteId);
    onRefresh();
  };

  const setRating = async (r) => {
    await api.updateBook(book.id, { rating: r });
    onRefresh();
  };

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="book-detail-header">
            <h2>{book.title}</h2>
            <div className="author">{book.author}{book.genre ? ` · ${book.genre}` : ''}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Оценка:</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1,2,3,4,5].map(r => (
            <button
              key={r}
              onClick={() => setRating(r)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: r <= (book.rating || 0) ? '#f4c430' : '#444' }}
            >★</button>
          ))}
        </div>
      </div>

      {book.total_pages > 0 && (
        <div style={{ marginBottom: 12, fontSize: 13, color: '#888' }}>
          Прогресс: {book.current_page || 0} / {book.total_pages} стр.
          <div className="progress-bar" style={{ marginTop: 6 }}>
            <div className="progress-fill" style={{ width: `${Math.round(((book.current_page || 0) / book.total_pages) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="actions">
        {book.status === 'wishlist' && (
          <button className="btn btn-primary" onClick={startReading}>Начать читать</button>
        )}
        {book.status === 'reading' && (
          <button className="btn btn-primary" onClick={finishBook}>Дочитал</button>
        )}
        <button className="btn btn-secondary" onClick={onAddNote}>+ Заметка</button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 16 }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
          Заметки ({book.notes?.length || 0})
        </div>
        <div className="note-list" style={{ overflowY: 'auto', flex: 1 }}>
          {(!book.notes || book.notes.length === 0) && (
            <p className="empty">Заметок пока нет. Надиктуйте мысль голосом!</p>
          )}
          {book.notes?.map(note => (
            <div key={note.id} className="note-item">
              <div className="note-type">{NOTE_TYPES[note.type] || note.type}</div>
              <div>{note.content}</div>
              {note.page && <div className="note-page">стр. {note.page}</div>}
              <button
                onClick={() => deleteNote(note.id)}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11, marginTop: 6 }}
              >удалить</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
