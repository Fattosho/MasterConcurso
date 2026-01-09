import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', color: 'text-blue-500', glow: 'shadow-blue-500/20', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'simulator', label: 'Simulador', color: 'text-emerald-500', glow: 'shadow-emerald-500/20', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'essay', label: 'Redação', color: 'text-rose-500', glow: 'shadow-rose-500/20', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 'mindmap', label: 'Mapa Mental', color: 'text-purple-500', glow: 'shadow-purple-500/20', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { id: 'flashcards', label: 'Flashcards', color: 'text-amber-500', glow: 'shadow-amber-500/20', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'mnemonics', label: 'Mnêmico', color: 'text-pink-500', glow: 'shadow-pink-500/20', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'study-plan', label: 'Plano', color: 'text-indigo-500', glow: 'shadow-indigo-500/20', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <>
      <header className={`md:hidden flex items-center justify-between p-6 sticky top-0 z-50 border-b backdrop-blur-2xl ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-3">
            <span className="text-white font-black text-2xl italic">C</span>
          </div>
          <h1 className="font-black text-xl tracking-tighter uppercase glow-text">Concurso<span className="text-blue-500">Master</span></h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'text-zinc-400 bg-white/5 hover:bg-white/10' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </header>

      <aside className={`
        fixed inset-y-0 left-0 w-80 h-full flex flex-col z-50 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border-r
        md:translate-x-0 md:sticky md:top-0
        ${theme === 'dark' ? 'bg-zinc-950/40 border-white/5 backdrop-blur-[40px]' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(37,99,235,0.4)] group cursor-pointer transition-transform duration-500 hover:scale-110 hover:-rotate-6">
             <span className="text-white font-black text-4xl italic">C</span>
          </div>
          <h1 className={`font-black text-2xl mt-6 leading-none uppercase tracking-tighter glow-text ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>CONCURSO</h1>
          <span className="text-blue-500 font-extrabold text-[11px] tracking-[0.5em] uppercase mt-2">MASTER ELITE</span>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={`w-full text-left px-6 py-4 rounded-[1.5rem] transition-all flex items-center gap-5 group btn-click-effect relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]' 
                  : theme === 'dark' ? 'text-zinc-500 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-50"></div>
              )}
              <svg className={`w-5 h-5 transition-all duration-300 ${activeTab === item.id ? 'scale-110' : item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              <span className={`font-black text-[11px] uppercase tracking-[0.15em] relative z-10 transition-all ${activeTab === item.id ? 'translate-x-1' : ''}`}>{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-6">
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all btn-click-effect shadow-sm group ${
              theme === 'dark' ? 'bg-zinc-900/50 border-white/5 text-zinc-300 hover:border-blue-500/40 hover:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">{theme === 'dark' ? 'PROTOCOLO DARK' : 'PROTOCOLO CLEAN'}</span>
            <span className="text-xl group-hover:scale-125 transition-transform duration-300">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          
          <div className={`p-5 rounded-[1.5rem] border flex items-center gap-4 transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute inset-0"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 relative shadow-[0_0_15px_rgba(16,185,129,0.7)]"></div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>INTELIGÊNCIA ATIVA</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;