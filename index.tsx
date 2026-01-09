import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro crítico na renderização do React:", error);
    container.innerHTML = `
      <div style="padding: 40px; color: #ef4444; font-family: sans-serif; text-align: center;">
        <h1 style="font-size: 20px; font-weight: 800;">ERRO DE CARREGAMENTO</h1>
        <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">Ocorreu uma falha ao iniciar o aplicativo. Verifique o console do navegador (F12).</p>
      </div>
    `;
  }
}