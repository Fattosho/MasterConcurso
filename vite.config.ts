import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do ambiente atual (como as do Netlify)
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // Substitui process.env.API_KEY pela string real da chave durante o build
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    }
  };
});