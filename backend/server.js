const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const VALID_STATUSES = ['reading', 'finished', 'wishlist'];
const VALID_NOTE_TYPES = ['thought', 'quote', 'summary'];

// --- Books ---

app.get('/api/books', (req, res) => {
  const { status } = req.query;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  const books = status
    ? db.prepare('SELECT * FROM books WHERE status = ? ORDER BY added_at DESC').all(status)
    : db.prepare('SELECT * FROM books ORDER BY added_at DESC').all();
  res.json(books);
});

app.get('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });
  const notes = db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').all(book.id);
  res.json({ ...book, notes });
});

app.post('/api/books', (req, res) => {
  const { title, author, genre, status = 'wishlist', total_pages } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'title and author required' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });

  const finishedAt = status === 'finished' ? new Date().toISOString() : null;

  const result = db.prepare(`
    INSERT INTO books (title, author, genre, status, total_pages, finished_at) VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, author, genre || null, status, total_pages || null, finishedAt);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(book);
});

app.patch('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  if (req.body.rating !== undefined) {
    const r = Number(req.body.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be integer 1-5' });
    }
    req.body.rating = r;
  }

  const fields = ['title', 'author', 'genre', 'status', 'rating', 'total_pages', 'current_page', 'finished_at'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (req.body.status === 'finished' && !req.body.finished_at) {
    updates.finished_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) return res.json(book);

  const set = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE books SET ${set} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
});

app.delete('/api/books/:id', (req, res) => {
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

// --- Notes ---

app.get('/api/books/:id/notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(notes);
});

app.post('/api/books/:id/notes', (req, res) => {
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const { type = 'thought', content, page } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  if (!VALID_NOTE_TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });

  const result = db.prepare(
    'INSERT INTO notes (book_id, type, content, page) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, type, content, page || null);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

// --- Search ---

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const results = db.prepare(`
    SELECT n.id, n.type, n.content, n.page, n.created_at,
           b.id as book_id, b.title as book_title, b.author as book_author
    FROM notes n
    JOIN books b ON b.id = n.book_id
    WHERE n.content LIKE ? OR b.title LIKE ? OR b.author LIKE ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(like, like, like);
  res.json(results);
});

// --- Stats ---

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as n FROM books').get().n;
  const finished = db.prepare("SELECT COUNT(*) as n FROM books WHERE status = 'finished'").get().n;
  const reading = db.prepare("SELECT COUNT(*) as n FROM books WHERE status = 'reading'").get().n;
  const wishlist = db.prepare("SELECT COUNT(*) as n FROM books WHERE status = 'wishlist'").get().n;
  const avgRating = db.prepare("SELECT AVG(rating) as avg FROM books WHERE rating IS NOT NULL").get().avg;
  const thisYear = db.prepare(`
    SELECT COUNT(*) as n FROM books
    WHERE status = 'finished' AND strftime('%Y', finished_at) = strftime('%Y', 'now')
  `).get().n;
  const topBooks = db.prepare(`
    SELECT id, title, author, rating FROM books
    WHERE rating IS NOT NULL ORDER BY rating DESC LIMIT 5
  `).all();
  const notesCount = db.prepare('SELECT COUNT(*) as n FROM notes').get().n;

  res.json({ total, finished, reading, wishlist, avgRating, thisYear, topBooks, notesCount });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
