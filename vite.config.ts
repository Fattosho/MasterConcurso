import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env local E do ambiente do sistema (Netlify)
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // Essas substituições transformam o acesso em tempo de execução em strings literais durante o build
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env': JSON.stringify({ API_KEY: apiKey })
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'recharts'],
            genai: ['@google/genai']
          }
        }
      }
    }
  };
});