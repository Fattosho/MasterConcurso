
import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  user?: any;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', color: 'text-blue-500', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'simulator', label: 'Simulador', color: 'text-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'essay', label: 'Redação', color: 'text-rose-500', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 'mindmap', label: 'Mapa Mental', color: 'text-blue-500', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { id: 'flashcards', label: 'Flashcards', color: 'text-amber-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'mnemonics', label: 'Mnêmico', color: 'text-pink-500', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'study-plan', label: 'Plano', color: 'text-indigo-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <>
      <header className={`md:hidden flex items-center justify-between p-6 sticky top-0 z-50 border-b backdrop-blur-2xl ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black italic">C</span>
          </div>
          <h1 className="font-black text-lg uppercase glow-text tracking-tighter">Master</h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </header>

      <aside className={`
        fixed inset-y-0 left-0 w-72 h-full flex flex-col z-50 transition-all duration-500 border-r
        md:translate-x-0 md:sticky md:top-0
        ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-200 shadow-xl'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] mx-auto flex items-center justify-center shadow-xl shadow-blue-600/20 mb-4">
             <span className="text-white font-black text-3xl italic">C</span>
          </div>
          <h1 className="font-black text-xl uppercase tracking-tighter">CONCURSO<span className="text-blue-600">MASTER</span></h1>
        </div>

        {user && (
          <div className="px-6 py-4 mb-4 border-y border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 text-xs font-black">
                {user.profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest truncate">{user.profile?.full_name || 'Usuário'}</p>
                <p className="text-[8px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-4 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
              </svg>
              <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-3">
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-zinc-900 text-zinc-300' : 'bg-slate-50 text-slate-700'}`}
          >
            <span>{theme === 'dark' ? 'Dark' : 'Clean'}</span>
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sair
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
