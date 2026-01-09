import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import Flashcards from './components/Flashcards';
import StudyPlan from './components/StudyPlan';
import MindMapCreator from './components/MindMapCreator';
import { UserPerformance } from './types';

const App: React.FC = () => {
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

  useEffect(() => {
    localStorage.setItem('user_performance', JSON.stringify(performance));
  }, [performance]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* Background Decorativo */}
      {theme === 'dark' ? (
        <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>
      ) : (
        <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      )}
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative z-10 scrollbar-hide">
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