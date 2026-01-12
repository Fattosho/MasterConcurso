import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * IMPORTANTE:
 * O erro 'supabaseUrl is required' ocorre quando createClient é chamado com strings vazias.
 * Para evitar o crash imediato do app, usamos placeholders se as variáveis estiverem ausentes.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Flag para verificar se a integração está realmente ativa
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));

// Inicializamos o cliente. Se não houver URL, usamos um placeholder para evitar o erro de 'required' do construtor
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-to-avoid-crash.supabase.co',
  supabaseAnonKey || 'no-key-provided'
);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ SUPABASE NÃO CONFIGURADO: O sistema de autenticação e banco de dados está offline.\n" +
    "Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente do Netlify."
  );
}
