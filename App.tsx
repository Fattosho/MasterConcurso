
import React, { useState, useEffect } from 'react';
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
    const saved = localStorage.getItem('app-theme');
    return (saved as 'dark' | 'light') || 'dark';
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
    } catch (e) { console.error(e); }
    return { totalAnswered: 0, correctAnswers: 0, subjectStats: {}, xp: 0, level: 1 };
  });

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data as UserProfile;
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

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      } else {
        setUser(null);
      }
    });
  }, []);

  const profile = user?.profile as UserProfile;

  // Lógica de Assinatura, Trial e Teto
  const isSubscriber = profile?.is_active_subscriber === true;
  const usageAmount = profile?.monthly_api_usage ?? 0;
  
  // O usuário tem acesso se: For assinante houve não atingiu o limite de teste (Trial)
  const hasTrialAccess = usageAmount < API_LIMIT_CONFIG.TRIAL_LIMIT_BRL;
  const canAccessAI = isSubscriber || hasTrialAccess;

  const usageLimitReached = usageAmount >= API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL;

  const SubscriptionWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 glass-card rounded-[4rem] border border-blue-600/30 animate-in zoom-in">
      <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-pulse">🚀</div>
      <h2 className="text-4xl font-black uppercase mb-4 glow-text">Período de Teste Encerrado</h2>
      <p className="text-zinc-500 font-bold mb-10 max-w-md">Você explorou as ferramentas Master no modo experimental. Para continuar sua evolução com IA ilimitada, ative seu plano agora.</p>
      
      <div className="p-10 rounded-3xl border border-blue-600/30 bg-zinc-950/50 flex flex-col items-center max-w-sm w-full">
         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Plano Mensal Master</p>
         <h4 className="text-5xl font-black mb-1">R$ 47</h4>
         <p className="text-zinc-500 text-[10px] font-bold uppercase mb-8">por mês</p>
         
         <ul className="text-left space-y-3 mb-10 w-full">
            <li className="text-[10px] font-bold flex items-center gap-2 text-zinc-300"><span className="text-blue-500">✓</span> Questões Ilimitadas*</li>
            <li className="text-[10px] font-bold flex items-center gap-2 text-zinc-300"><span className="text-blue-500">✓</span> Corretor de Redação IA</li>
            <li className="text-[10px] font-bold flex items-center gap-2 text-zinc-300"><span className="text-blue-500">✓</span> Mapas Mentais Infinitos</li>
            <li className="text-[10px] font-bold flex items-center gap-2 text-zinc-300"><span className="text-blue-500">✓</span> Mentor por Voz (Gemini Live)</li>
         </ul>

         <a href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} target="_blank" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 transition-all text-white text-center shadow-xl shadow-blue-600/20">
           Ativar Acesso Master
         </a>
      </div>
      
      <p className="mt-8 text-[9px] text-zinc-600 font-bold uppercase">*Sujeito a política de uso justo (R$ {API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL} em custos de processamento/mês)</p>
    </div>
  );

  const UsageLimitWall = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 glass-card rounded-[4rem] border border-rose-600/30 animate-in zoom-in">
      <div className="w-24 h-24 bg-rose-600/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-pulse">⚠️</div>
      <h2 className="text-4xl font-black uppercase mb-4 text-rose-500">Teto de Uso Atingido</h2>
      <p className="text-zinc-500 font-bold mb-10 max-w-md">Você atingiu o limite de R$ {API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL},00 em processamento de IA para este mês. Suas ferramentas serão liberadas automaticamente no primeiro dia do próximo mês.</p>
      <button onClick={() => setActiveTab('dashboard')} className="bg-zinc-900 text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Voltar ao Painel</button>
    </div>
  );

  if (loading) return <div className="h-screen w-screen bg-black flex items-center justify-center text-blue-600 font-black tracking-widest uppercase">Sincronizando Terminal...</div>;
  if (!user) return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        user={user} 
        onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} 
      />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto w-full page-transition">
          {activeTab === 'dashboard' ? (
             <Dashboard 
              performance={performance} 
              setActiveTab={setActiveTab} 
              theme={theme} 
              profile={profile}
             />
          ) : !canAccessAI ? (
             <SubscriptionWall />
          ) : usageLimitReached ? (
             <UsageLimitWall />
          ) : (
            <>
              {activeTab === 'simulator' && <Simulator onQuestionAnswered={(isCorrect, subject) => {
                setPerformance(prev => {
                  const stats = { ...(prev.subjectStats || {}) };
                  const current = stats[subject] || { total: 0, correct: 0 };
                  const newXp = (prev.xp || 0) + (isCorrect ? 30 : 5);
                  return {
                    ...prev,
                    totalAnswered: (prev.totalAnswered || 0) + 1,
                    correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
                    xp: newXp,
                    level: Math.floor(newXp / 1000) + 1,
                    subjectStats: { ...stats, [subject]: { total: current.total + 1, correct: current.correct + (isCorrect ? 1 : 0) } }
                  };
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

      {/* MEDIDOR DE USO MENSAL / TRIAL INDICATOR */}
      <div className="fixed bottom-8 right-8 z-[100] glass-card px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-6 animate-in slide-in-from-right-10">
         <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
               {isSubscriber ? `Uso IA (Teto R$ ${API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL})` : 'Modo Experimental (Trial)'}
            </p>
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${usageLimitReached || (!isSubscriber && !hasTrialAccess) ? 'bg-rose-500' : isSubscriber ? 'bg-blue-500' : 'bg-amber-500'}`} 
                 style={{ 
                    width: `${isSubscriber 
                      ? Math.min((usageAmount / API_LIMIT_CONFIG.MONTHLY_LIMIT_BRL) * 100, 100) 
                      : Math.min((usageAmount / API_LIMIT_CONFIG.TRIAL_LIMIT_BRL) * 100, 100)}%` 
                 }}
               ></div>
            </div>
         </div>
         <div className="h-8 w-[1px] bg-white/10"></div>
         <div>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</p>
            <p className={`text-[10px] font-black uppercase ${isSubscriber ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
               {isSubscriber ? 'Assinante' : 'Experimental'}
            </p>
         </div>
      </div>
    </div>
  );
};

export default App;
