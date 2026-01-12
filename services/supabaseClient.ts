
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));

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

// Tabela de custos estimados em Reais por chamada (Aproximado)
const COST_PER_CALL = {
  FLASH: 0.05, // Gemini Flash é muito barato, mas estimamos conservadoramente
  PRO: 0.15,   // Gemini Pro é mais caro
  IMAGE: 0.25  // Geração de imagem consome mais recursos
};

export const trackApiUsage = async (userId: string, type: keyof typeof COST_PER_CALL) => {
  if (!isSupabaseConfigured) return;
  
  try {
    const cost = COST_PER_CALL[type];
    
    // Incrementa o custo no perfil do usuário via RPC ou Update direto
    const { data, error } = await supabase.rpc('increment_api_usage', { 
      user_id: userId, 
      cost_to_add: cost 
    });

    if (error) {
      // Fallback se a RPC não existir
      const { data: profile } = await supabase.from('profiles').select('api_usage_brl').eq('id', userId).single();
      const newTotal = (profile?.api_usage_brl || 0) + cost;
      await supabase.from('profiles').update({ api_usage_brl: newTotal }).eq('id', userId);
    }
  } catch (e) {
    console.error("Erro ao rastrear uso de API:", e);
  }
};
