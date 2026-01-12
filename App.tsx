
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
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const KIWIFY_CHECKOUT_URL = "https://pay.kiwify.com.br/SEU_LINK_AQUI";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Added toggleTheme function to resolve "Cannot find name 'toggleTheme'" error
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
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) return null;

      // Se não houver trial_started_at, inicializamos agora
      if (!data.trial_started_at) {
        const { data: updated } = await supabase
          .from('profiles')
          .update({ trial_started_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();
        return updated as UserProfile;
      }

      return data as UserProfile;
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await fetchProfile(session.user.id);
          setUser({ ...session.user, profile });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const profile = await fetchProfile(session.user.id);
          setUser({ ...session.user, profile });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });
    }
  }, []);

  // LÓGICA DE BLOQUEIO DE ACESSO
  const checkAccess = () => {
    if (!user || !user.profile) return { allowed: false, reason: 'loading' };
    
    const profile = user.profile as UserProfile;
    const now = new Date();
    const trialStart = new Date(profile.trial_started_at);
    const diffHours = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    // 1. Bloqueio por Consumo de API (R$ 20,00)
    if (profile.api_usage_brl >= 20) {
      return { allowed: false, reason: 'api_limit' };
    }

    // 2. Se for Premium, acesso liberado (exceto se atingir limite de API)
    if (profile.is_premium) return { allowed: true };

    // 3. Regras de Trial para não-pagantes
    if (activeTab === 'simulator') {
      if (diffDays > 3) return { allowed: false, reason: 'trial_simulator_expired' };
    } else if (activeTab !== 'dashboard') {
      if (diffHours > 2) return { allowed: false, reason: 'trial_tools_expired' };
    }

    return { allowed: true };
  };

  const access = checkAccess();

  const UpgradeOverlay = ({ reason }: { reason: string }) => {
    const messages: Record<string, any> = {
      api_limit: {
        title: "Limite de Cota Atingido",
        desc: "Você atingiu o limite de R$ 20,00 em processamento de IA para este mês. Isso garante a sustentabilidade da plataforma."
      },
      trial_simulator_expired: {
        title: "Trial de 3 Dias Encerrado",
        desc: "Seu período de degustação da Arena de Combate terminou. Torne-se Elite para continuar treinando."
      },
      trial_tools_expired: {
        title: "Ferramentas Bloqueadas",
        desc: "O acesso às ferramentas avançadas (Redação, Mapas, Flashcards) expira após 2 horas no plano gratuito."
      }
    };

    const msg = messages[reason] || { title: "Acesso Restrito", desc: "Assine o plano mensal para liberar o acesso total." };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 glass-card rounded-[4rem] border border-blue-600/30 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-5xl mb-8 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
          💎
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 glow-text">{msg.title}</h2>
        <p className="text-zinc-500 font-bold text-sm max-w-md mb-10 leading-relaxed">
          {msg.desc}
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <a 
            href={KIWIFY_CHECKOUT_URL} 
            target="_blank"
            className="bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/30"
          >
            LIBERAR ACESSO ELITE (R$ 97/mês)
          </a>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
        <p className="mt-8 text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Pagamento Seguro via Kiwify</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">Autenticando Credenciais Elite</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen theme={theme} onLoginSuccess={(u) => setUser(u)} />;
  }

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
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto w-full page-transition">
          {!access.allowed && activeTab !== 'dashboard' ? (
            <UpgradeOverlay reason={access.reason} />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard performance={performance} setActiveTab={setActiveTab} theme={theme} />}
              {activeTab === 'simulator' && <Simulator onQuestionAnswered={(c, s) => {}} theme={theme} />}
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
