
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://qreebuimtidztsplibef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZWVidWltdGlkenRzcGxpYmVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzODIxMiwiZXhwIjoyMDgzODE0MjEyfQ.hyZ3SzI0OIHdrs5BztIwVkelhS3sY9A0bZ7eyvxsHmI';

export const KIWIFY_CONFIG = {
  ACCOUNT_ID: 'm46hUHaAvdwgjCW',
  SUBSCRIPTION_LINK: 'https://pay.kiwify.com.br/30vsESq' 
};

export const API_LIMIT_CONFIG = {
  MONTHLY_LIMIT_BRL: 30.00,
  TRIAL_LIMIT_BRL: 1.50 
};

export const isSupabaseConfigured = supabaseUrl.includes('.supabase.co') && supabaseKey.length > 20;

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'no-key-provided'
);

const API_COSTS = {
  GENERATE_QUESTION: 0.05,
  EVALUATE_ESSAY: 0.25,
  GENERATE_MINDMAP: 0.40,
  STUDY_PLAN: 0.10,         
  MNEMONIC: 0.05            
};

// Função resiliente: não bloqueia a experiência se o RPC falhar
export const trackApiUsage = async (userId: string, action: keyof typeof API_COSTS): Promise<boolean> => {
  if (!isSupabaseConfigured || !userId) return true;
  
  try {
    const cost = API_COSTS[action] || 0.05;
    const { data: success, error } = await supabase.rpc('track_usage', { 
      user_id: userId, 
      cost_to_add: cost 
    });

    if (error) {
      console.warn(`[UsageTrack] RPC 'track_usage' indisponível. Liberando acesso.`);
      return true;
    }
    return success !== false; 
  } catch (e) {
    return true; 
  }
};
