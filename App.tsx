
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

    authTimeoutRef.current = setTimeout(() => {
      setAuthError(true);
    }, 2000);

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
  const usageLimitReached = usageAmount >= API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL;

  if (loading) return (
    <div className="h-screen w-screen bg-[#050507] flex flex-col items-center justify-center p-8 overflow-hidden text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-blue-600/10 rounded-full"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <div className="space-y-3 mb-10">
        <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.6em] animate-pulse">Sincronizando Sistema de Elite</p>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Autenticando Identidade Digital v1.0</p>
      </div>

      <div className={`space-y-4 w-full max-w-xs transition-all duration-700 ${authError ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
         <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-[2rem] space-y-4">
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
              A autenticação está demorando mais que o esperado?
            </p>
            <button 
              onClick={handleForceReset}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 transition-all active:scale-95"
            >
              ⚠️ LIMPAR CACHE E REFAZER LOGIN
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              🔄 Reiniciar Terminal
            </button>
         </div>
         <p className="text-[7px] text-zinc-700 font-bold uppercase tracking-[0.3em]">RECOMENDADO PARA SESSÕES TRAVADAS</p>
      </div>
    </div>
  );

  if (!user) return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;

  const SubscriptionWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-10 glass-card rounded-[3.5rem] border border-blue-600/30 animate-in zoom-in duration-500 shadow-2xl">
      <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">🚀</div>
      <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter">Limites de <span className="text-blue-600">IA Trial</span> Excedidos</h2>
      <p className="text-zinc-500 text-[11px] font-bold mb-10 max-w-xs leading-relaxed">
        Você atingiu o teto do modo experimental. Migre para o Plano Master para desbloquear todo o poder da inteligência competitiva.
      </p>
      
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 shadow-inner">
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Assinatura Profissional</p>
           <p className="text-3xl font-black text-white">R$ 47,00<span className="text-sm text-zinc-500 font-normal">/mês</span></p>
        </div>
        <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95">
          DESBLOQUEAR TUDO AGORA
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
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full">
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
