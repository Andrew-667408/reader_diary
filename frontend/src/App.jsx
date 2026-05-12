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
  const [addBookPages, setAddBookPages] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const deletingNoteRef = useRef(false);

  const refresh = () => setRefreshKey(k => k + 1);

  // Stable ref for getState so the assistant always sees current screen
  const stateRef = useRef({ current_screen: 'main', current_tab: 'reading', current_book_id: null });
  useEffect(() => {
    stateRef.current = { current_screen: screen, current_tab: activeTab, current_book_id: openBookId };
  }, [screen, activeTab, openBookId]);

  const getState = useCallback(() => stateRef.current, []);

  // History API — enables TV remote back button (popstate).
  // Two initial entries ('base' + 'main') act as a safety net: double-back events
  // (e.g. closing a numeric keyboard on SberBox fires two history.back() calls)
  // never exit the app — they just land back on main.
  useEffect(() => {
    window.history.replaceState({ rdScreen: 'base' }, '');
    window.history.pushState({ rdScreen: 'main' }, '');
    const handlePop = (e) => {
      if (e.state?.rdScreen === 'base') {
        // Popped past the app root — restore the main entry so the app never exits.
        window.history.pushState({ rdScreen: 'main' }, '');
      }
      setScreen('main');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Helper: navigate forward and push history entry
  const navigateTo = useCallback((newScreen, bookId) => {
    window.history.pushState({ rdScreen: newScreen }, '');
    if (newScreen === 'book' && bookId != null) {
      openBookIdRef.current = bookId;
      setOpenBookId(bookId);
    }
    setScreen(newScreen);
  }, []);

  useEffect(() => {
    const assistant = initAssistant(getState);

    assistant.on('data', (event) => {
      // Insets: native UI (icon, panel) tells us how much padding to reserve
      if (
        event.type === 'insets' ||
        event.type === 'dynamic_insets' ||
        event.type === 'minimum_static_insets' ||
        event.type === 'maximum_static_insets'
      ) {
        const { top = 0, right = 0, bottom = 0, left = 0 } = event.insets || {};
        const root = document.documentElement;
        root.style.setProperty('--inset-top', `${top}px`);
        root.style.setProperty('--inset-right', `${right}px`);
        root.style.setProperty('--inset-bottom', `${bottom}px`);
        root.style.setProperty('--inset-left', `${left}px`);
        return;
      }

      const { action } = event;
      if (!action) return;
      switch (action.action_id) {
        case 'show_list':
          setScreen('main');
          if (action.parameters?.status) setActiveTab(action.parameters.status);
          break;
        case 'open_book':
          navigateTo('book', action.parameters?.bookId);
          break;
        case 'add_book':
          setAddBookTitle(action.parameters?.title || '');
          setAddBookPages(action.parameters?.pages ? String(action.parameters.pages) : '');
          setShowAddBook(true);
          break;
        case 'add_note':
          if (openBookIdRef.current && action.parameters?.content) {
            api.createNote(openBookIdRef.current, {
              type: action.parameters.type || 'thought',
              content: action.parameters.content,
            }).then(refresh).catch(console.error);
          } else if (openBookIdRef.current) {
            setShowAddNote(true);
          }
          break;
        case 'finish_book': {
          const titleQuery = action.parameters?.title;
          const targetId = action.parameters?.bookId || openBookIdRef.current;

          const doFinish = (id) =>
            api.updateBook(id, { status: 'finished' }).then(refresh).catch(console.error);

          if (titleQuery) {
            api.getBooks().then(books => {
              const q = titleQuery.toLowerCase();
              const match = books.find(b =>
                b.title.toLowerCase().includes(q) || q.includes(b.title.toLowerCase())
              );
              if (match) doFinish(match.id);
            }).catch(console.error);
          } else if (targetId) {
            doFinish(targetId);
          }
          break;
        }
        case 'start_reading': {
          const titleQuery = action.parameters?.title;
          const targetId = action.parameters?.bookId || openBookIdRef.current;

          const doStartReading = (id) => {
            api.updateBook(id, { status: 'reading' }).then(refresh).catch(console.error);
            if (!openBookIdRef.current) {
              navigateTo('book', id);
            }
          };

          if (titleQuery) {
            api.getBooks().then(books => {
              const q = titleQuery.toLowerCase();
              const match = books.find(b =>
                b.title.toLowerCase().includes(q) || q.includes(b.title.toLowerCase())
              );
              if (match) doStartReading(match.id);
            }).catch(console.error);
          } else if (targetId) {
            doStartReading(targetId);
          }
          break;
        }
        case 'rate_book': {
          const titleQuery = action.parameters?.title;
          const targetId = action.parameters?.bookId || openBookIdRef.current;
          const rating = Number(action.parameters?.rating);

          const doRate = (id) => {
            if (rating >= 1 && rating <= 5)
              api.updateBook(id, { rating }).then(refresh).catch(console.error);
          };

          if (titleQuery) {
            api.getBooks().then(books => {
              const q = titleQuery.toLowerCase();
              const match = books.find(b =>
                b.title.toLowerCase().includes(q) || q.includes(b.title.toLowerCase())
              );
              if (match) doRate(match.id);
            }).catch(console.error);
          } else if (targetId) {
            doRate(targetId);
          }
          break;
        }
        case 'delete_book': {
          const titleQuery = action.parameters?.title;
          const targetId = action.parameters?.bookId || openBookIdRef.current;

          const doDelete = (id) => {
            const onGone = () => {
              if (openBookIdRef.current === id) {
                openBookIdRef.current = null;
                setOpenBookId(null);
                setScreen('main');
              }
              refresh();
            };
            api.deleteBook(id).then(onGone).catch((err) => {
              console.error(err);
              // Treat 404 as already-deleted — still navigate away
              if (err?.error === 'Not found' || err?.status === 404) onGone();
            });
          };

          if (titleQuery) {
            api.getBooks().then(books => {
              const q = titleQuery.toLowerCase();
              const match = books.find(b =>
                b.title.toLowerCase().includes(q) || q.includes(b.title.toLowerCase())
              );
              if (match) doDelete(match.id);
            }).catch(console.error);
          } else if (targetId) {
            doDelete(targetId);
          }
          break;
        }
        case 'delete_last_note': {
          const bookId = openBookIdRef.current;
          if (bookId && !deletingNoteRef.current) {
            deletingNoteRef.current = true;
            api.getBook(bookId).then((book) => {
              const notes = book.notes || [];
              if (notes.length > 0) {
                const last = notes[0]; // notes sorted DESC by created_at
                api.deleteNote(last.id)
                  .then(refresh)
                  .catch(() => refresh()) // treat 404 as already gone — still refresh
                  .finally(() => { deletingNoteRef.current = false; });
              } else {
                deletingNoteRef.current = false;
              }
            }).catch(() => { deletingNoteRef.current = false; });
          }
          break;
        }
        case 'search_notes': {
          const query = action.parameters?.query;
          if (query) {
            api.searchNotes(query).then((results) => {
              // TODO: показать результаты — пока просто переходим на главный экран
              setScreen('main');
            }).catch(console.error);
          }
          break;
        }
        case 'show_stats':
          navigateTo('stats');
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
          onOpenBook={(id) => navigateTo('book', id)}
          onAddBook={() => { setAddBookTitle(''); setShowAddBook(true); }}
          onStats={() => navigateTo('stats')}
          refreshKey={refreshKey}
        />
      )}
      {screen === 'book' && openBookId && (
        <BookPage
          bookId={openBookId}
          onBack={goBack}
          onAddNote={() => setShowAddNote(true)}
          onRefresh={refresh}
          onDelete={() => {
            openBookIdRef.current = null;
            setOpenBookId(null);
            setScreen('main');
            refresh();
          }}
          refreshKey={refreshKey}
        />
      )}
      {screen === 'stats' && <StatsPage onBack={goBack} refreshKey={refreshKey} />}

      {showAddBook && (
        <AddBookModal
          initialTitle={addBookTitle}
          initialPages={addBookPages}
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
