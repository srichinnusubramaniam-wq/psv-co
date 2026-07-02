import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSupabaseSync } from './lib/supabase.ts';

// Initialize Supabase Synchronization
initializeSupabaseSync();

// Mitigate iframe/sandbox localStorage access blocks
try {
  const testKey = '__test_local_storage_accessibility__';
  localStorage.setItem(testKey, testKey);
  localStorage.removeItem(testKey);
} catch (e) {
  console.warn('LocalStorage is disabled or restricted in this environment. Using memory storage fallback.', e);
  const createMockStorage = () => {
    let memoryStore: Record<string, string> = {};
    return {
      getItem: (key: string) => (Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null),
      setItem: (key: string, value: string) => { memoryStore[key] = String(value); },
      removeItem: (key: string) => { delete memoryStore[key]; },
      clear: () => { memoryStore = {}; },
      key: (index: number) => Object.keys(memoryStore)[index] || null,
      get length() { return Object.keys(memoryStore).length; }
    };
  };
  const mockStorage = createMockStorage();
  try {
    Object.defineProperty(Window.prototype, 'localStorage', {
      get: () => mockStorage,
      set: () => {},
      configurable: true
    });
  } catch (err) {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    } catch (err2) {
      console.warn('Unable to redefine window.localStorage', err2);
    }
  }
  const mockSessionStorage = createMockStorage();
  try {
    Object.defineProperty(Window.prototype, 'sessionStorage', {
      get: () => mockSessionStorage,
      set: () => {},
      configurable: true
    });
  } catch (err) {
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
        configurable: true
      });
    } catch (err2) {
      console.warn('Unable to redefine window.sessionStorage', err2);
    }
  }
}

// Ignore benign cross-origin/recharts resize observer exceptions and cross-origin Script errors
window.addEventListener('error', (event) => {
  const msg = (event?.message || '').toLowerCase();
  if (
    msg.includes('resizeobserver') ||
    msg.includes('script error')
  ) {
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event?.reason || '');
  if (
    reason.includes('ResizeObserver') ||
    reason.toLowerCase().includes('script error')
  ) {
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

