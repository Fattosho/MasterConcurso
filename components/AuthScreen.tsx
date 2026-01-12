
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
        if (!email.trim() || !password.trim()) {
          throw new Error("Preencha e-mail e senha para acessar.");
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) {
          if (authError.message.includes("Email not confirmed")) {
            throw new Error("⚠️ Acesso Bloqueado: Confirme seu e-mail para entrar no painel.");
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
        if (!fullName.trim()) throw new Error("O campo Nome Completo é obrigatório.");
        if (!email.trim()) throw new Error("O campo E-mail é obrigatório.");
        if (!whatsapp.trim()) throw new Error("O campo WhatsApp é obrigatório.");
        if (!password.trim()) throw new Error("O campo Senha é obrigatório.");
        if (!confirmPassword.trim()) throw new Error("A confirmação de senha é obrigatória.");
        
        if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
        if (whatsapp.replace(/\D/g, '').length < 10) throw new Error("Informe um WhatsApp válido com DDD.");
        
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
            setError("Identidade já registrada. Tente fazer login no painel.");
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

  const inputStyle = `w-full p-4 md:p-5 rounded-2xl border outline-none transition-all duration-500 font-medium text-base md:text-sm ${
    theme === 'dark' 
      ? 'bg-zinc-950/40 border-white/5 text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder:text-zinc-700' 
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
  }`;

  const labelStyle = "block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1";

  if (showPaymentStep) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] px-4 py-12 overflow-x-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-[520px] w-full glass-card p-10 md:p-14 rounded-[3rem] border border-blue-600/30 text-center space-y-8 animate-in zoom-in duration-500 shadow-[0_0_100px_rgba(37,99,235,0.1)] relative">
          <div className="w-24 h-24 bg-blue-600/10 rounded-full mx-auto flex items-center justify-center text-5xl animate-bounce shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            📩
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Confirme seu <span className="text-blue-600">E-mail</span></h2>
            <div className="p-6 bg-zinc-950/50 rounded-3xl border border-white/5">
              <p className="text-zinc-400 text-[12px] font-bold leading-relaxed">
                Quase lá! Enviamos um link de ativação para o seu e-mail. 
                <br/><br/>
                Para acessar o seu <span className="text-white">Painel de Estudos</span> e liberar todas as ferramentas de IA, você precisa clicar no link enviado.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => { setShowPaymentStep(false); setIsLogin(true); }}
              className="group relative block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              JÁ CONFIRMEI, FAZER LOGIN NO PAINEL
            </button>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-loose">
              Não recebeu? Verifique sua caixa de SPAM ou promoções.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start md:justify-center bg-[#050508] px-4 py-12 md:py-8 relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center mb-10 group mt-4 md:mt-0">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-white/10 transform transition-transform group-hover:scale-105 duration-500">
              <span className="text-white font-black text-4xl md:text-5xl italic tracking-tighter">C</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase glow-text">
            CONCURSO<span className="text-blue-600">MASTER</span>
          </h1>
          <div className="w-10 h-1 bg-blue-600/30 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="glass-card p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-600/40 to-transparent"></div>

          <div className="flex bg-zinc-950/80 p-1 rounded-2xl mb-8 border border-white/5 shadow-inner">
            <button 
              onClick={() => setIsLogin(true)} 
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${isLogin ? 'bg-blue-600 text-white shadow-[0_5px_15px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)} 
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${!isLogin ? 'bg-blue-600 text-white shadow-[0_5px_15px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Assinar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className={labelStyle}>Nome Completo *</label>
                <input type="text" placeholder="João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputStyle} />
              </div>
            )}
            <div>
              <label className={labelStyle}>E-mail *</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} />
            </div>
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className={labelStyle}>WhatsApp *</label>
                <input type="tel" placeholder="11 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputStyle} />
              </div>
            )}
            <div className={`grid grid-cols-1 gap-5 ${isLogin ? '' : 'md:grid-cols-2'}`}>
              <div>
                <label className={labelStyle}>Senha *</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} />
              </div>
              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className={labelStyle}>Confirmar *</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyle} />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase text-center animate-bounce">
                {error}
              </div>
            )}

            <button 
              disabled={loading} 
              className="group relative w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-2xl shadow-blue-600/30 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (isLogin ? 'Entrar no Painel' : 'CRIAR CONTA MASTER')}
            </button>
          </form>

          {isLogin && (
            <p className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              Ainda não tem conta? <button onClick={() => setIsLogin(false)} className="text-blue-500 hover:text-blue-400 underline underline-offset-4 transition-colors">Assinar Plano Master</button>
            </p>
          )}
        </div>
        
        <p className="mt-8 text-center text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em] opacity-40">
          Assinado: Equipe ConcursoMaster ELITE
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
