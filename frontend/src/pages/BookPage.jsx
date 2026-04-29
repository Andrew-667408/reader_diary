import React, { useEffect, useState } from 'react';
import { api } from '../api';

const NOTE_TYPES = { thought: 'Мысль', quote: 'Цитата', summary: 'Вывод' };

export function BookPage({ bookId, onBack, onAddNote, onRefresh, onDelete, refreshKey }) {
  const [book, setBook] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.getBook(bookId).then((data) => {
      setBook(data);
      setPageInput(String(data.current_page || 0));
    }).catch(console.error);
  }, [bookId, refreshKey]);

  if (!book) return <div className="page"><p className="empty">Загрузка…</p></div>;

  const finishBook = async () => {
    await api.updateBook(book.id, { status: 'finished' }).catch(console.error);
    onRefresh();
  };

  const startReading = async () => {
    await api.updateBook(book.id, { status: 'reading' }).catch(console.error);
    onRefresh();
  };

  const deleteBook = async () => {
    await api.deleteBook(book.id).catch(console.error);
    onDelete();
  };

  const deleteNote = async (noteId) => {
    await api.deleteNote(noteId).catch(console.error);
    onRefresh();
  };

  const setRating = async (r) => {
    await api.updateBook(book.id, { rating: r }).catch(console.error);
    onRefresh();
  };

  const updatePage = async () => {
    const p = parseInt(pageInput, 10);
    if (isNaN(p) || p < 0) { setPageInput(String(book.current_page || 0)); return; }
    const clamped = book.total_pages ? Math.min(p, book.total_pages) : p;
    if (clamped === (book.current_page || 0)) return;
    await api.updateBook(book.id, { current_page: clamped }).catch(console.error);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span>Прогресс:</span>
            <input
              type="number"
              min="0"
              max={book.total_pages}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onBlur={updatePage}
              onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              style={{ width: 64, padding: '2px 6px', fontSize: 13, borderRadius: 6, border: '1px solid #c8b99a', background: '#fff', color: '#2c2c2c', outline: 'none' }}
            />
            <span>/ {book.total_pages} стр.</span>
          </div>
          <div className="progress-bar">
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
        {confirmDelete
          ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fdecea', border: '1px solid #e57373', borderRadius: 10, padding: '8px 12px', flex: 1 }}>
              <span style={{ fontSize: 13, flex: 1 }}>Удалить «{book.title}»?</span>
              <button className="btn btn-danger" style={{ padding: '6px 14px' }} onClick={deleteBook}>Да</button>
              <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setConfirmDelete(false)}>Нет</button>
            </div>
          : <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Удалить книгу</button>
        }
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
