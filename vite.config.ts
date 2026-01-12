import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do ambiente atual (como as do Netlify ou arquivo .env)
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || '';
  const supabaseUrl = env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // Substitui as expressões de ambiente pelas strings reais durante o build.
      // Isso evita o erro de 'undefined' ao tentar acessar import.meta.env em ambientes sem suporte.
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    }
  };
});