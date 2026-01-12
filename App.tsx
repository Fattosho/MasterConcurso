
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
    } catch (e) { console.error("Falha ao ler performance local:", e); }
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
      
      if (error) {
        console.warn("Perfil não encontrado ou erro de acesso:", error.message);
        return null;
      }
      return data as UserProfile;
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
      return null;
    }
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const profile = await fetchProfile(user.id);
      if (profile) {
        setUser(prev => ({ ...prev, profile }));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('user_performance');
    setUser(null);
    setActiveTab('dashboard');
  };

  // Função para limpar cache e forçar login em caso de travamento
  const handleForceReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
    } catch (e) {}
    window.location.reload();
  };

  const initAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Timeout para mostrar opções de erro se a sessão travar
    authTimeoutRef.current = setTimeout(() => {
      setAuthError(true);
    }, 4000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erro na sessão Supabase:", sessionError);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      }
    } catch (err) {
      console.error("Falha crítica no InitAuth:", err);
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
  
  const hasTrialBalance = usageAmount < API_LIMIT_CONFIG.TRIAL_LIMIT_BRL;
  const canAccessAI = isSubscriber || hasTrialBalance;
  const usageLimitReached = usageAmount >= API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL;

  if (loading) return (
    <div className="h-screen w-screen bg-[#050507] flex flex-col items-center justify-center gap-6 p-10 overflow-hidden">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">Autenticando Identidade Digital</p>
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest">ConcursoMaster ELITE Edition v1.0</p>
      </div>

      <div className={`mt-8 space-y-4 transition-all duration-1000 ${authError ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex flex-col gap-3">
           <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600/10 border border-blue-600/30 rounded-xl text-[10px] font-black uppercase text-blue-500 tracking-widest hover:bg-blue-600/20 transition-all active:scale-95"
            >
              🔄 Reiniciar Terminal
            </button>
            <button 
              onClick={handleForceReset}
              className="px-8 py-3 bg-rose-600/5 border border-rose-600/20 rounded-xl text-[9px] font-black uppercase text-rose-500/60 tracking-widest hover:bg-rose-600/10 transition-all active:scale-95"
            >
              ⚠️ Limpar Acesso e Refazer Login
            </button>
         </div>
         <p className="text-[7px] text-zinc-700 font-bold uppercase tracking-widest text-center">Solução para sessões expiradas no navegador</p>
      </div>
    </div>
  );

  if (!user) return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;

  const SubscriptionWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 md:p-10 glass-card rounded-[3rem] border border-blue-600/30 animate-in zoom-in duration-500 shadow-[0_0_80px_rgba(37,99,235,0.1)]">
      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl">🚀</div>
      <h2 className="text-2xl md:text-3xl font-black uppercase mb-4 tracking-tighter">Limites do <span className="text-blue-600">Modo Trial</span> Atingidos</h2>
      <p className="text-zinc-500 text-[11px] md:text-xs font-bold mb-8 max-w-xs leading-relaxed">
        Você explorou o limite do modo experimental. Ative o Plano Master para desbloquear todas as ferramentas de IA de forma ilimitada.
      </p>
      
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 shadow-inner">
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Assinatura Mensal Master</p>
           <p className="text-3xl font-black text-white">R$ 47,00<span className="text-sm text-zinc-500 font-normal">/mês</span></p>
        </div>
        
        <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95">
          ATIVAR ACESSO ILIMITADO
        </a>
        
        <button onClick={refreshProfile} className="w-full text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-blue-500 transition-all underline underline-offset-4">
          Já sou assinante? Sincronizar Agora
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' ? (
             <Dashboard performance={performance} setActiveTab={setActiveTab} theme={theme} profile={profile} onProfileUpdate={refreshProfile} />
          ) : !canAccessAI ? (
             <SubscriptionWall />
          ) : (usageLimitReached && isSubscriber) ? (
             <div className="text-center p-12 glass-card rounded-[3rem] border border-blue-600/20 animate-in slide-in-from-top-10">
               <div className="text-5xl mb-6">⚡</div>
               <h2 className="text-2xl font-black text-blue-600 mb-4 uppercase tracking-tighter">Protocolo de Estabilização</h2>
               <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-md mx-auto">
                 Detectamos uma carga de processamento extremamente alta em sua conta. Para garantir a máxima qualidade das respostas da IA para todos os membros Master, seu terminal entrou em um breve modo de resfriamento. O acesso completo será reestabelecido automaticamente.
               </p>
             </div>
          ) : (
            <div className="relative">
              {!isSubscriber && activeTab !== 'dashboard' && (
                <div className="mb-6 bg-amber-600/10 border border-amber-600/20 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏳</span>
                    <div>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Acesso Trial Ativado</p>
                      <p className="text-[10px] text-zinc-500 font-bold mt-1">Uso: R$ {usageAmount.toFixed(2)} / R$ {API_LIMIT_CONFIG.TRIAL_LIMIT_BRL.toFixed(2)}</p>
                    </div>
                  </div>
                  <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="text-[9px] font-black text-white bg-amber-600 px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-amber-600/20">Upgrade</a>
                </div>
              )}

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
