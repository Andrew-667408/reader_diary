import React, { useEffect, useState } from 'react';
import { api } from '../api';

export function StatsPage({ onBack, refreshKey }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, [refreshKey]);

  if (!stats) return <div className="page"><p className="empty">Загрузка…</p></div>;

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>←</button>
        <h1>Статистика</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.finished}</div>
          <div className="label">Прочитано</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.reading}</div>
          <div className="label">Читаю сейчас</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.wishlist}</div>
          <div className="label">Хочу прочитать</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.thisYear}</div>
          <div className="label">В этом году</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.notesCount}</div>
          <div className="label">Заметок</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.avgRating ? stats.avgRating.toFixed(1) : '—'}</div>
          <div className="label">Средняя оценка</div>
        </div>
      </div>

      {stats.topBooks.length > 0 && (
        <>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>Топ-5 по оценке</div>
          <ul className="top-list">
            {stats.topBooks.map(b => (
              <li key={b.id}>
                <span>{b.title} <span style={{ color: '#888', fontSize: 12 }}>· {b.author}</span></span>
                <span style={{ color: '#f4c430' }}>{'★'.repeat(b.rating)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
