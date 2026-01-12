
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * IMPORTANTE:
 * O uso de sessionStorage garante que a sessão seja destruída quando a aba é fechada.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Flag para verificar se a integração está realmente ativa
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));

// Inicializamos o cliente com configuração de persistência em sessão
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-to-avoid-crash.supabase.co',
  supabaseAnonKey || 'no-key-provided',
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ SUPABASE NÃO CONFIGURADO: O sistema de autenticação e banco de dados está offline.\n" +
    "Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da VERCEL."
  );
}
