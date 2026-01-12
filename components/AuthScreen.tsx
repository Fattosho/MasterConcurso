
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
      setError("O Banco de Dados (Supabase) não está configurado. Verifique as variáveis de ambiente (Environment Variables) no Dashboard da Vercel.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // LOGIN
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        // Buscar perfil adicional
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileFetchError) console.warn("Perfil não encontrado:", profileFetchError.message);

        onLoginSuccess({ ...data.user, profile });
      } else {
        // REGISTRO
        if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
        if (whatsapp.length < 8) throw new Error("Informe um WhatsApp válido.");
        
        // 1. Criar usuário no Auth
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (authError) {
          if (authError.message.includes("already registered")) {
            setError("Este e-mail já está em uso. Tente fazer login.");
            setLoading(false);
            return;
          }
          throw authError;
        }

        if (data.user) {
          // 2. Salvar dados na tabela profiles usando UPSERT (mais seguro que insert direto)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              full_name: fullName, 
              email: email, 
              whatsapp: whatsapp,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          
          if (profileError) {
            console.error("Erro no DB:", profileError);
            throw new Error(`Perfil criado no Auth, mas falhou no DB: ${profileError.message}`);
          }
        }

        alert("REGISTRO DE ELITE CONCLUÍDO! Faça login para acessar o terminal.");
        setIsLogin(true);
        // Limpar campos de registro
        setFullName('');
        setWhatsapp('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na autenticação.");
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-[480px] page-transition">
        <div className="text-center mb-10">
          <div className="inline-block w-20 h-20 bg-blue-600 rounded-[2rem] mb-6 flex items-center justify-center shadow-2xl shadow-blue-600/40 transform -rotate-6">
            <span className="text-white font-black text-4xl italic">C</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase glow-text">
            CONCURSO<span className="text-blue-600">MASTER</span>
          </h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Protocolo de Acesso Elite</p>
        </div>

        <div className="glass-card p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl mb-10 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className={labelStyle}>Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Seu nome oficial"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputStyle} 
                />
              </div>
            )}

            <div>
              <label className={labelStyle}>E-mail de Login</label>
              <input 
                type="email" 
                required
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle} 
              />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className={labelStyle}>WhatsApp para Mentorias</label>
                <input 
                  type="tel" 
                  required
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={inputStyle} 
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Senha</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyle} 
                />
              </div>
              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className={labelStyle}>Confirmar</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputStyle} 
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase text-center animate-shake leading-relaxed tracking-widest">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all btn-click-effect shadow-xl shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                isLogin ? 'Acessar Terminal' : 'Criar Perfil Elite'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">
            Ao continuar você concorda com nossos <br/> protocolos de segurança e termos de uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
