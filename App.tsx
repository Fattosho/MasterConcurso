
import React, { useState, useEffect, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn("Usuário sem perfil ou erro de RLS:", error.message);
      return null;
    }
    return data as UserProfile;
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

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      }
      setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const profile = user?.profile as UserProfile;
  const isSubscriber = profile?.is_active_subscriber === true;
  const usageAmount = profile?.monthly_api_usage ?? 0;
  
  // Acesso Master se for Assinante OU estiver dentro do limite trial experimental
  const canAccessAI = isSubscriber || (usageAmount < API_LIMIT_CONFIG.TRIAL_LIMIT_BRL);
  
  // Bloqueio por abuso de faturamento (teto de custo Gemini)
  const usageLimitReached = usageAmount >= API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL;

  if (loading) return (
    <div className="h-screen w-screen bg-[#050507] flex flex-col items-center justify-center gap-6 p-10">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">Autenticando Identidade Digital</p>
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest mt-2">ConcursoMaster ELITE Edition v1.0</p>
      </div>
    </div>
  );

  if (!user) return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;

  const SubscriptionWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 md:p-10 glass-card rounded-[3rem] border border-blue-600/30 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl">🚀</div>
      <h2 className="text-2xl md:text-3xl font-black uppercase mb-4 tracking-tighter">Upgrade Necessário</h2>
      <p className="text-zinc-500 text-[11px] md:text-xs font-bold mb-10 max-w-xs leading-relaxed">
        Você explorou o limite do modo experimental. Ative o Plano Master para desbloquear questões, redações e mapas mentais ilimitados.
      </p>
      
      <div className="w-full max-w-sm space-y-4">
        <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95">
          REATIVAR ACESSO MASTER
        </a>
        <button onClick={refreshProfile} className="w-full text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-blue-500 transition-all underline underline-offset-4">
          Já paguei? Sincronizar Agora
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
             <div className="text-center p-12 glass-card rounded-[3rem] border border-rose-500/20 animate-in slide-in-from-top-10">
               <div className="text-5xl mb-6">⚠️</div>
               <h2 className="text-2xl font-black text-rose-500 mb-4 uppercase tracking-tighter">Teto de Billing Atingido</h2>
               <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-md mx-auto">
                 Detectamos um uso atípico de recursos este mês. Por segurança financeira, suas ferramentas de IA serão resetadas no primeiro dia do próximo mês.
               </p>
             </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
