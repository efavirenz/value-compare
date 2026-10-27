import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { loadState } from './storage';
import { applyTheme } from './themes';
import './styles.css';

// Apply saved theme and language before the first paint to avoid a flash of the wrong colors.
const initial = loadState();
applyTheme(initial.theme);
document.documentElement.lang = initial.lang;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App initial={initial} />
    </ErrorBoundary>
  </React.StrictMode>,
);
