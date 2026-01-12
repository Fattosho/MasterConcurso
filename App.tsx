
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import Flashcards from './components/Flashcards';
import StudyPlan from './components/StudyPlan';
import MindMapCreator from './components/MindMapCreator';
import AuthScreen from './components/AuthScreen';
import { UserPerformance, UserProfile } from './types';
import { supabase, isSupabaseConfigured, KIWIFY_CONFIG, API_LIMIT_CONFIG } from './services/supabaseClient';

// Removed redundant declare global for window.aistudio as it conflicts with the environment's existing AIStudio type definition.

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  const authTimeoutRef = useRef<any>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const [performance, setPerformance] = useState<UserPerformance>(() => {
    try {
      const saved = localStorage.getItem('user_performance');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { totalAnswered: 0, correctAnswers: 0, subjectStats: {}, xp: 0, level: 1 };
  });

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data as UserProfile;
    } catch (e) { return null; }
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const profile = await fetchProfile(user.id);
      if (profile) setUser(prev => ({ ...prev, profile }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user_performance');
      setUser(null);
      setActiveTab('dashboard');
    } catch (e) {}
  };

  const handleOptimizeAndReload = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = window.location.origin;
    } catch (e) {
      window.location.reload();
    }
  };

  const handleSelectApiKey = async () => {
    try {
      // Access aistudio directly as it is assumed to be provided by the environment
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        await aistudio.openSelectKey();
        // After selection, we reload to ensure the new key is available in the environment
        window.location.reload();
      } else {
        alert("Ambiente AI Studio não detectado.");
      }
    } catch (e) {
      console.error("Erro ao abrir seletor de chaves:", e);
    }
  };

  const initAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    authTimeoutRef.current = setTimeout(() => {
      setAuthError(true);
    }, 3000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      }
    } catch (err) {
      console.error("Auth Init Error:", err);
    } finally {
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    };
  }, [initAuth, fetchProfile]);

  const profile = user?.profile as UserProfile;
  const isSubscriber = profile?.is_active_subscriber === true;
  const usageAmount = profile?.monthly_api_usage ?? 0;
  const canAccessAI = isSubscriber || (usageAmount < API_LIMIT_CONFIG.TRIAL_LIMIT_BRL);

  if (loading) return (
    <div className="h-screen w-screen bg-[#050507] flex flex-col items-center justify-center p-8 overflow-hidden text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-blue-600/5 rounded-full"></div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-blue-600 animate-pulse font-black italic text-xl">C</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-12">
        <p className="text-[14px] font-black text-white uppercase tracking-[0.4em]">Iniciando Terminal Elite</p>
        <div className="flex justify-center gap-1">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
           ))}
        </div>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold max-w-xs mx-auto leading-relaxed">Sincronizando protocolos de IA e segurança avançada...</p>
      </div>

      <div className={`space-y-4 w-full max-w-sm transition-all duration-1000 transform ${authError ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
         <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[3rem] backdrop-blur-xl space-y-6 shadow-2xl shadow-blue-600/5">
            <div className="space-y-2">
               <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Otimização Sugerida</p>
               <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">Detectamos que sua sessão de segurança precisa ser renovada ou a quota de IA excedeu.</p>
            </div>
            
            <button 
              onClick={handleOptimizeAndReload}
              className="group relative w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              OTIMIZAR E ENTRAR NO TERMINAL
            </button>

            <button 
              onClick={handleSelectApiKey}
              className="w-full text-[9px] font-black text-zinc-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
            >
              ⚙️ CONFIGURAR CHAVE PRÓPRIA (GOOGLE AI STUDIO)
            </button>
         </div>
         <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-[0.5em]">Protocolo v2.6 - Resiliência de IA</p>
      </div>
    </div>
  );

  if (!user) return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;

  const SubscriptionWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-10 glass-card rounded-[3.5rem] border border-blue-600/30 animate-in zoom-in duration-500 shadow-2xl">
      <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">🚀</div>
      <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter">Limites de <span className="text-blue-600">Modo Trial</span> Atingidos</h2>
      <p className="text-zinc-500 text-[11px] font-bold mb-10 max-w-xs leading-relaxed">
        Você explorou o potencial máximo do modo gratuito. Migre para o Plano Master para continuar sua jornada de aprovação com IA ilimitada.
      </p>
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 shadow-inner">
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Acesso Profissional</p>
           <p className="text-3xl font-black text-white">R$ 47,00<span className="text-sm text-zinc-500 font-normal">/mês</span></p>
        </div>
        <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95">
          DESBLOQUEAR TUDO AGORA
        </a>
        <button onClick={handleSelectApiKey} className="w-full text-[9px] font-black text-zinc-600 hover:text-blue-500 uppercase tracking-widest transition-all">
          Usar Chave Própria (Avançado)
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} />
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-end mb-4">
             <button onClick={handleSelectApiKey} className="text-[8px] font-black text-zinc-600 hover:text-blue-500 uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                Quota AI: Ajustar Chave
             </button>
          </div>
          {activeTab === 'dashboard' ? (
             <Dashboard performance={performance} setActiveTab={setActiveTab} theme={theme} profile={profile} onProfileUpdate={refreshProfile} />
          ) : !canAccessAI ? (
             <SubscriptionWall />
          ) : (
            <div className="relative">
              {activeTab === 'simulator' && <Simulator onQuestionAnswered={(isCorrect, subject) => {
                setPerformance(prev => {
                  const stats = { ...(prev.subjectStats || {}) };
                  const current = stats[subject] || { total: 0, correct: 0 };
                  const newXp = (prev.xp || 0) + (isCorrect ? 30 : 5);
                  const newPerf = {
                    ...prev,
                    totalAnswered: (prev.totalAnswered || 0) + 1,
                    correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
                    xp: newXp,
                    level: Math.floor(newXp / 1000) + 1,
                    subjectStats: { ...stats, [subject]: { total: current.total + 1, correct: current.correct + (isCorrect ? 1 : 0) } }
                  };
                  localStorage.setItem('user_performance', JSON.stringify(newPerf));
                  return newPerf;
                });
              }} theme={theme} />}
              {activeTab === 'essay' && <EssaySimulator theme={theme} />}
              {activeTab === 'mindmap' && <MindMapCreator theme={theme} />}
              {activeTab === 'flashcards' && <Flashcards theme={theme} />}
              {activeTab === 'mnemonics' && <MnemonicGenerator theme={theme} />}
              {activeTab === 'study-plan' && <StudyPlan theme={theme} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
