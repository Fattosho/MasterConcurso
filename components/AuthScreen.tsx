
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, KIWIFY_CONFIG } from '../services/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
  theme: 'dark' | 'light';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, theme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("O Banco de Dados não está configurado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) {
          if (authError.message.includes("Email not confirmed")) {
            throw new Error("⚠️ Por favor, confirme seu e-mail ou finalize a assinatura.");
          }
          throw authError;
        }
        
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        onLoginSuccess({ ...data.user, profile });
      } else {
        // --- ASSINATURA (REGISTRO + VENDA) ---
        if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
        if (whatsapp.length < 8) throw new Error("Informe um WhatsApp válido.");
        
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              whatsapp: whatsapp.replace(/\D/g, '')
            }
          }
        });
        
        if (authError) {
          if (authError.message.includes("already registered")) {
            setError("E-mail já cadastrado. Tente fazer login.");
            setLoading(false);
            return;
          }
          throw authError;
        }

        setShowPaymentStep(true);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = `w-full p-4 rounded-2xl border outline-none transition-all duration-300 font-medium text-sm ${
    theme === 'dark' 
      ? 'bg-zinc-950/50 border-white/10 text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600' 
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
  }`;

  const labelStyle = "block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1";

  if (showPaymentStep) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508] px-4">
        <div className="max-w-[480px] w-full glass-card p-10 md:p-14 rounded-[3rem] border border-blue-600/30 text-center space-y-8 animate-in zoom-in duration-500 shadow-[0_0_100px_rgba(37,99,235,0.1)]">
          <div className="w-24 h-24 bg-blue-600/10 rounded-full mx-auto flex items-center justify-center text-5xl animate-bounce">
            💳
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Conta Criada com <span className="text-blue-600">Sucesso!</span></h2>
            <p className="text-zinc-400 text-xs font-bold leading-relaxed">
              Para liberar o acesso <span className="text-white">Ilimitado</span> às questões, redações e mentorias por IA, finalize seu pagamento na Kiwify.
            </p>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-black">Plano Master Profissional</p>
              <p className="text-2xl font-black text-white">R$ 47,00<span className="text-xs text-zinc-500 font-normal">/mês</span></p>
            </div>
          </div>
          
          <div className="space-y-4">
            <a 
              href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} 
              target="_blank" 
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              FINALIZAR ASSINATURA AGORA
            </a>
            <button 
              onClick={() => { setShowPaymentStep(false); setIsLogin(true); }}
              className="text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4"
            >
              Já paguei, quero entrar
            </button>
          </div>
          
          <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Pagamento 100% Seguro via Kiwify</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508] overflow-y-auto px-4 py-8">
      <div className="relative z-10 w-full max-w-[480px] page-transition">
        <div className="text-center mb-10">
          <div className="inline-block w-20 h-20 bg-blue-600 rounded-[2rem] mb-6 flex items-center justify-center shadow-2xl shadow-blue-600/40">
            <span className="text-white font-black text-4xl italic">C</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase glow-text">
            CONCURSO<span className="text-blue-600">MASTER</span>
          </h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 italic">Inteligência Competitiva de Elite</p>
        </div>

        <div className="glass-card p-8 md:p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
          <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl mb-10 border border-white/5">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Fazer Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Assinar</button>
          </div>

          {!isLogin && (
            <div className="mb-8 p-4 bg-blue-600/5 border border-blue-600/20 rounded-2xl text-center">
               <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Oferta Especial</p>
               <p className="text-lg font-black text-white uppercase tracking-tighter">PLANO MASTER R$ 47/MÊS</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div>
                <label className={labelStyle}>Nome Completo</label>
                <input type="text" required placeholder="Ex: João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputStyle} />
              </div>
            )}
            <div>
              <label className={labelStyle}>E-mail</label>
              <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} />
            </div>
            {!isLogin && (
              <div>
                <label className={labelStyle}>WhatsApp (DDD + Número)</label>
                <input type="tel" required placeholder="11999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputStyle} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Senha</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} />
              </div>
              {!isLogin && (
                <div>
                  <label className={labelStyle}>Confirmar Senha</label>
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyle} />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase text-center animate-pulse">
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl shadow-blue-600/30">
              {loading ? "Processando..." : (isLogin ? 'Entrar no Terminal' : 'ASSINAR PLANO MASTER - R$ 47/MÊS')}
            </button>
          </form>

          {isLogin && (
            <p className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              Novo por aqui? <button onClick={() => setIsLogin(false)} className="text-blue-500 hover:text-blue-400">Começar Assinatura</button>
            </p>
          )}
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
          <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Segurança:</div>
          <div className="text-[10px] font-black text-white">SSL</div>
          <div className="text-[10px] font-black text-white">Supabase</div>
          <div className="text-[10px] font-black text-white">Kiwify</div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
