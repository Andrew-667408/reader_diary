import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initAssistant } from './assistant';
import { api } from './api';
import { MainPage } from './pages/MainPage';
import { BookPage } from './pages/BookPage';
import { StatsPage } from './pages/StatsPage';
import { AddBookModal } from './components/AddBookModal';
import { AddNoteModal } from './components/AddNoteModal';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('main');
  const [activeTab, setActiveTab] = useState('reading');
  const [openBookId, setOpenBookId] = useState(null);
  const openBookIdRef = useRef(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [addBookTitle, setAddBookTitle] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  const getState = useCallback(() => ({
    current_screen: screen,
    current_tab: activeTab,
    current_book_id: openBookId,
  }), [screen, activeTab, openBookId]);

  useEffect(() => {
    const assistant = initAssistant(getState);

    assistant.on('error', (event) => {
      console.warn('assistant error', event);
    });

    assistant.on('data', (event) => {
      const { action } = event;
      if (!action) return;
      switch (action.action_id) {
        case 'show_list':
          setScreen('main');
          if (action.parameters?.status) setActiveTab(action.parameters.status);
          break;
        case 'open_book':
          openBookIdRef.current = action.parameters?.bookId;
          setOpenBookId(action.parameters?.bookId);
          setScreen('book');
          break;
        case 'add_book':
          setAddBookTitle(action.parameters?.title || '');
          setShowAddBook(true);
          break;
        case 'add_note':
          if (openBookIdRef.current && action.parameters?.content) {
            api.createNote(openBookIdRef.current, {
              type: action.parameters.type || 'thought',
              content: action.parameters.content,
            }).then(refresh);
          } else if (openBookIdRef.current) {
            setShowAddNote(true);
          }
          break;
        case 'finish_book':
          refresh();
          break;
        case 'show_stats':
          setScreen('stats');
          break;
        default:
          break;
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = () => {
    if (screen === 'book' || screen === 'stats') setScreen('main');
  };

  return (
    <div className="app">
      {screen === 'main' && (
        <MainPage
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenBook={(id) => { openBookIdRef.current = id; setOpenBookId(id); setScreen('book'); }}
          onAddBook={() => { setAddBookTitle(''); setShowAddBook(true); }}
          onStats={() => setScreen('stats')}
          refreshKey={refreshKey}
        />
      )}
      {screen === 'book' && openBookId && (
        <BookPage
          bookId={openBookId}
          onBack={goBack}
          onAddNote={() => setShowAddNote(true)}
          onRefresh={refresh}
          refreshKey={refreshKey}
        />
      )}
      {screen === 'stats' && <StatsPage onBack={goBack} refreshKey={refreshKey} />}

      {showAddBook && (
        <AddBookModal
          initialTitle={addBookTitle}
          onClose={() => setShowAddBook(false)}
          onSaved={() => { setShowAddBook(false); refresh(); }}
        />
      )}
      {showAddNote && openBookId && (
        <AddNoteModal
          bookId={openBookId}
          onClose={() => setShowAddNote(false)}
          onSaved={() => { setShowAddNote(false); refresh(); }}
        />
      )}
    </div>
  );
}
