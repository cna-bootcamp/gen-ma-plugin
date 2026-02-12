import React from 'react';
import ReactDOM from 'react-dom/client';
import './stores/themeStore.js'; // Initialize theme (dark class on <html>) before render
import './stores/langStore.js'; // Initialize language from localStorage/browser before render
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
