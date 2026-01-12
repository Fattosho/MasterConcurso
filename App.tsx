
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
import { supabase, isSupabaseConfigured, KIWIFY_CONFIG, API_LIMIT_CONFIG, saveUserPerformance, loadUserPerformance } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  const authTimeoutRef = useRef<any>(null);

  const [performance, setPerformance] = useState<UserPerformance>({
    totalAnswered: 0,
    correctAnswers: 0,
    subjectStats: {},
    xp: 0,
    level: 1
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const fetchProfileAndPerformance = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const remotePerf = await loadUserPerformance(userId);
      if (remotePerf) setPerformance(remotePerf);

      return profile as UserProfile;
    } catch (e) { return null; }
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const profile = await fetchProfileAndPerformance(user.id);
      if (profile) setUser(prev => ({ ...prev, profile }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveTab('dashboard');
    } catch (e) {}
  };

  const handleResetAndReload = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut().catch(() => {});
    window.location.reload();
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
        const profile = await fetchProfileAndPerformance(session.user.id);
        setUser({ ...session.user, profile });
      }
    } catch (err) {
      console.error("Auth Init Error:", err);
    } finally {
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      setLoading(false);
    }
  }, [fetchProfileAndPerformance]);

  useEffect(() => {
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfileAndPerformance(session.user.id);
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
  }, [initAuth, fetchProfileAndPerformance]);

  const profile = user?.profile as UserProfile;
  const isSubscriber = profile?.is_active_subscriber === true;
  const usageAmount = profile?.monthly_api_usage ?? 0;
  const canAccessAI = isSubscriber || (usageAmount < API_LIMIT_CONFIG.TRIAL_LIMIT_BRL);

  if (loading || authError) return (
    <div className="h-screen w-screen bg-[#050507] flex flex-col items-center justify-center p-8 text-center">
      {!authError ? (
        <div className="space-y-8 animate-pulse">
           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
           <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Iniciando Protocolos...</p>
        </div>
      ) : (
        <div className="max-w-xs w-full space-y-6 animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">⚠️</div>
           <h2 className="text-xl font-black text-white uppercase tracking-tighter">ERRO DE CONEXÃO</h2>
           <button 
             onClick={handleResetAndReload}
             className="w-full bg-rose-600 hover:bg-rose-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/30 transition-all active:scale-95"
           >
             REPARAR LOGIN
           </button>
        </div>
      )}
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
      </div>
    </div>
  );

  const handleUpdatePerformance = (isCorrect: boolean, subject: string) => {
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
      
      if (user?.id) saveUserPerformance(user.id, newPerf);
      return newPerf;
    });
  };

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} user={user} onLogout={handleLogout} />
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' ? (
             <Dashboard performance={performance} setActiveTab={setActiveTab} theme={theme} profile={profile} onProfileUpdate={refreshProfile} />
          ) : !canAccessAI ? (
             <SubscriptionWall />
          ) : (
            <div className="relative">
              {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleUpdatePerformance} theme={theme} />}
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
