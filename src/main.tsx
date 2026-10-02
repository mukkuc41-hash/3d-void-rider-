import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main id="main-content" aria-label="Void-Rider 3D space racing game">
      <h1 className="sr-only">Void-Rider 3D Multiplayer Space Racing</h1>
      <App />
    </main>
  </React.StrictMode>
);
