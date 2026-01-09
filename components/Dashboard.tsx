import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { UserPerformance } from '../types';

interface DashboardProps { 
  performance: UserPerformance; 
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
}

const Dashboard: React.FC<DashboardProps> = ({ performance, setActiveTab, theme }) => {
  const correct = performance.correctAnswers || 0;
  const total = performance.totalAnswered || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const xp = performance.xp || 0;
  const level = performance.level || Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const progressPercent = (xpInLevel / 1000) * 100;

  const chartColors = theme === 'dark' 
    ? { primary: '#3b82f6', empty: '#18181b', text: '#52525b' }
    : { primary: '#2563eb', empty: '#f1f5f9', text: '#94a3b8' };

  const chartData = [
    { name: 'Acertos', value: correct, color: chartColors.primary },
    { name: 'Resto', value: Math.max(0, total - correct), color: chartColors.empty },
  ];

  const cardBase = "glass-card p-10 rounded-[3rem] border transition-all duration-500 group relative overflow-hidden";

  return (
    <div className="space-y-10 page-transition">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none glow-text">Centro de <span className="text-blue-600">Comando</span></h2>
          </div>
          <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} text-sm font-bold uppercase tracking-[0.2em] ml-5`}>Sincronização de Progresso Cognitivo</p>
        </div>
        
        <div className={`flex items-center gap-8 p-8 rounded-[2.5rem] border group hover:scale-105 transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
           <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">REDE COMPETITIVA</p>
              <p className="text-3xl font-black text-blue-600 leading-none uppercase italic tracking-tighter">ELITE LV.{level}</p>
           </div>
           <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_10px_30px_rgba(37,99,235,0.4)] group-hover:rotate-12 transition-transform">
              <span className="text-3xl">⚡</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Progress Card */}
        <div className={`${cardBase} lg:col-span-8`}>
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
             <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
             </svg>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative z-10">
             <div className="space-y-6">
                <div>
                   <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.5em] mb-4">ESTATÍSTICA DE PRECISÃO</p>
                   <h3 className="text-8xl md:text-9xl font-black tracking-tighter leading-none glow-text">
                      {accuracy}<span className="text-blue-600 text-4xl font-light">%</span>
                   </h3>
                </div>
                <div className="flex gap-4">
                   <div className="px-5 py-3 bg-zinc-950/50 rounded-2xl border border-white/5 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Taxa de Sucesso</span>
                   </div>
                </div>
             </div>
             
             <div className="w-56 h-56 relative flex items-center justify-center p-4 rounded-full border border-white/5 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value" stroke="none" cornerRadius={10}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/5 flex items-center justify-center text-4xl shadow-2xl">
                      🎯
                   </div>
                </div>
             </div>
          </div>
          
          <div className="mt-16 space-y-5 relative z-10">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">PONTOS DE EXPERIÊNCIA</p>
                   <span className="text-lg font-black tracking-tight">{xpInLevel} <span className="text-zinc-500 text-xs font-bold">/ 1000 XP</span></span>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">PROGRESSO DE RANK</p>
                   <span className="text-xl font-black text-blue-600">{Math.round(progressPercent)}%</span>
                </div>
             </div>
             <div className={`h-6 w-full rounded-3xl overflow-hidden p-[4px] border transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5 shadow-inner' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
                <div 
                  className="h-full rounded-2xl transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                  style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white/30 blur-sm"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-8">
           <div className={`${cardBase} group hover:border-blue-600/50 cursor-pointer overflow-hidden`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">📝</div>
                   <div className="bg-blue-600/10 px-3 py-1 rounded-full text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">ESTÁVEL</div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">TOTAL PROCESSADO</p>
                   <p className="text-5xl font-black leading-none italic">{total}</p>
                   <p className="text-[9px] font-bold text-zinc-600 mt-2 uppercase">Questões resolvidas em 2024</p>
                </div>
              </div>
           </div>
           
           <div className={`${cardBase} group hover:border-emerald-500/50 cursor-pointer overflow-hidden`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">✅</div>
                   <div className="bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">+12% HOJE</div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">ACERTOS TÉCNICOS</p>
                   <p className="text-5xl font-black text-emerald-500 leading-none italic">{correct}</p>
                   <p className="text-[9px] font-bold text-emerald-600/60 mt-2 uppercase">Precisão confirmada pela IA</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Recommended Action Elite */}
      <div className={`p-12 md:p-16 rounded-[4rem] border flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.01] ${
        theme === 'dark' 
          ? 'bg-zinc-950 border-blue-600/20 shadow-blue-900/10' 
          : 'bg-white border-blue-200'
      }`}>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-gradient-x"></div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>
         
         <div className="space-y-6 text-center lg:text-left relative z-10 lg:max-w-2xl">
           <div className="inline-flex items-center gap-3 bg-blue-600 text-[10px] font-black px-6 py-2.5 rounded-full text-white uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30">
              <span className="animate-pulse">●</span> DIRETRIZ ESTRATÉGICA
           </div>
           <h4 className="text-3xl md:text-5xl font-black leading-tight uppercase tracking-tighter glow-text">Potencialize seu <span className="text-blue-600">Active Recall</span> agora.</h4>
           <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-sm tracking-tight leading-relaxed`}>
              Nossa IA identificou uma janela de oportunidade cognitiva em <span className="text-zinc-300">Direito Administrativo</span>. Realizar uma sessão de flashcards agora aumentará sua retenção em 40%.
           </p>
         </div>
         <button 
            onClick={() => setActiveTab('flashcards')}
            className="group relative px-16 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(37,99,235,0.4)] whitespace-nowrap overflow-hidden"
         >
            <span className="relative z-10">EXECUTAR REVISÃO</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         </button>
      </div>
    </div>
  );
};

export default Dashboard;