const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'diary.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT,
    status TEXT NOT NULL DEFAULT 'wishlist',
    rating INTEGER,
    total_pages INTEGER,
    current_page INTEGER DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'thought',
    content TEXT NOT NULL,
    page INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
`);

// seed if empty
const count = db.prepare('SELECT COUNT(*) as n FROM books').get().n;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO books (title, author, genre, status, rating, total_pages, current_page)
    VALUES (@title, @author, @genre, @status, @rating, @total_pages, @current_page)
  `);
  const insertNote = db.prepare(`
    INSERT INTO notes (book_id, type, content, page) VALUES (@book_id, @type, @content, @page)
  `);

  const b1 = insert.run({ title: 'Мастер и Маргарита', author: 'Михаил Булгаков', genre: 'Роман', status: 'finished', rating: 5, total_pages: 480, current_page: 480 });
  insertNote.run({ book_id: b1.lastInsertRowid, type: 'thought', content: 'Великолепная сатира на советское общество. Образ Воланда незабываем.', page: null });
  insertNote.run({ book_id: b1.lastInsertRowid, type: 'quote', content: 'Трусость — самый страшный порок.', page: 382 });

  const b2 = insert.run({ title: 'Преступление и наказание', author: 'Фёдор Достоевский', genre: 'Роман', status: 'reading', rating: null, total_pages: 608, current_page: 210 });
  insertNote.run({ book_id: b2.lastInsertRowid, type: 'thought', content: 'Психологизм Достоевского поражает. Раскольников — очень живой персонаж.', page: 150 });

  insert.run({ title: 'Дюна', author: 'Фрэнк Герберт', genre: 'Фантастика', status: 'wishlist', rating: null, total_pages: 896, current_page: 0 });
}

module.exports = db;
