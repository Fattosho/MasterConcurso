
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
  theme: 'dark' | 'light';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, theme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("O Banco de Dados não está configurado na Vercel.");
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
        if (authError) throw authError;
        
        // Buscar perfil (o trigger já deve ter criado, ou criamos agora se faltar)
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        onLoginSuccess({ ...data.user, profile });
      } else {
        // --- REGISTRO ---
        if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
        if (whatsapp.length < 8) throw new Error("Informe um WhatsApp válido.");
        
        // No registro, enviamos o full_name para o banco via options.data
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              whatsapp: whatsapp
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

        // Se o usuário foi criado, tentamos atualizar o perfil com o WhatsApp 
        // (Isso garante que mesmo se o trigger falhar, o dado seja gravado)
        if (data.user) {
          await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              full_name: fullName, 
              email: email, 
              whatsapp: whatsapp,
              updated_at: new Date().toISOString()
            });
        }

        alert("REGISTRO DE ELITE REALIZADO!\nVerifique seu e-mail (se a confirmação estiver ativa) ou faça login.");
        setIsLogin(true);
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
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 italic">Acesso Restrito</p>
        </div>

        <div className="glass-card p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl mb-10 border border-white/5">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isLogin ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Entrar</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isLogin ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Registrar</button>
          </div>

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
                <label className={labelStyle}>WhatsApp</label>
                <input type="tel" required placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputStyle} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Senha</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} />
              </div>
              {!isLogin && (
                <div>
                  <label className={labelStyle}>Confirmar</label>
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyle} />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase text-center animate-pulse">
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 shadow-xl shadow-blue-600/30">
              {loading ? "Processando..." : (isLogin ? 'Acessar Terminal' : 'Criar Perfil Elite')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
