
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

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [performance, setPerformance] = useState<UserPerformance>(() => {
    try {
      const saved = localStorage.getItem('user_performance');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return { totalAnswered: 0, correctAnswers: 0, subjectStats: {}, xp: 0, level: 1 };
  });

  // Função centralizada para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    } catch (err) {
      console.warn("Perfil não encontrado na DB ou DB offline:", err);
      return null;
    }
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkUser = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await fetchProfile(session.user.id);
          setUser({ ...session.user, profile });
        }
      } catch (err) {
        console.error("Erro na verificação de sessão:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const profile = await fetchProfile(session.user.id);
          setUser({ ...session.user, profile });
        } else {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('user_performance', JSON.stringify(performance));
  }, [performance]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const handleQuestionAnswered = (isCorrect: boolean, subject: string) => {
    setPerformance(prev => {
      const stats = { ...(prev.subjectStats || {}) };
      const current = stats[subject] || { total: 0, correct: 0 };
      const newXp = (prev.xp || 0) + (isCorrect ? 30 : 5);
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      return {
        ...prev,
        totalAnswered: (prev.totalAnswered || 0) + 1,
        correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
        xp: newXp,
        level: newLevel,
        subjectStats: {
          ...stats,
          [subject]: {
            total: current.total + 1,
            correct: current.correct + (isCorrect ? 1 : 0)
          }
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse">Sincronizando Sistema Elite</p>
        </div>
      </div>
    );
  }

  // AGORA: Se não houver usuário, mostre SEMPRE a tela de Auth (Login)
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
        user={user || { email: 'Modo Offline', profile: { full_name: 'Visitante' } }} 
        onLogout={isSupabaseConfigured ? handleLogout : undefined} 
      />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative z-10 scrollbar-hide">
        {!isSupabaseConfigured && (
          <div className="max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xl">⚠️</span>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
                  MODO OFFLINE ATIVO: As chaves do Supabase não foram encontradas no ambiente.
                </p>
              </div>
              <div className="flex gap-2">
                <a href="https://supabase.com/" target="_blank" className="text-[9px] font-black bg-amber-500 text-black px-4 py-2 rounded-lg uppercase">Configurar Chaves</a>
                <button onClick={() => window.location.reload()} className="text-[9px] font-black bg-zinc-800 text-white px-4 py-2 rounded-lg uppercase">Recarregar</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto w-full page-transition">
          {activeTab === 'dashboard' && <Dashboard performance={performance} setActiveTab={setActiveTab} theme={theme} />}
          {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} theme={theme} />}
          {activeTab === 'essay' && <EssaySimulator theme={theme} />}
          {activeTab === 'mindmap' && <MindMapCreator theme={theme} />}
          {activeTab === 'flashcards' && <Flashcards theme={theme} />}
          {activeTab === 'mnemonics' && <MnemonicGenerator theme={theme} />}
          {activeTab === 'study-plan' && <StudyPlan theme={theme} />}
        </div>
      </main>
    </div>
  );
};

export default App;
