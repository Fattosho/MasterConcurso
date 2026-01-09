
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserPerformance } from '../types';

interface DashboardProps { 
  performance: UserPerformance; 
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ performance, setActiveTab }) => {
  const correct = performance.correctAnswers || 0;
  const total = performance.totalAnswered || 0;
  const stats: Record<string, { total: number; correct: number }> = performance.subjectStats || {};
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // Gamification Logic
  const xp = performance.xp || total * 10;
  const level = performance.level || Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpToNext = 1000 - xpInLevel;
  const progressPercent = (xpInLevel / 1000) * 100;

  const chartData = [
    { name: 'Corretas', value: correct, color: '#3b82f6' },
    { name: 'Restante', value: Math.max(0, total - correct), color: '#18181b' },
  ];

  const subjectData = Object.entries(stats).map(([name, stat]) => ({
    name: name.split(' ').map(w => w[0]).join(''),
    fullName: name,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
  })).slice(0, 6);

  return (
    <div className="page-transition space-y-12 pb-16 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-2 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
             <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">PAINEL DE <span className="text-blue-400">ELITE</span></h2>
          </div>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.4em] ml-6">Monitoramento de Capacidade Cognitiva</p>
        </div>
        
        <div className="flex items-center gap-6 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl group hover:border-blue-500/30 transition-all relative overflow-hidden">
           {/* Mini Saber Bar in Header */}
           <div className="text-right z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">NÍVEL ATUAL</p>
              <p className="text-2xl font-black text-blue-400">RANK {level}</p>
              {/* Mini Lightsaber Progress */}
              <div className="h-1.5 w-24 bg-zinc-950 rounded-full mt-2 ml-auto overflow-hidden p-[1px] border border-white/5">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_#fff,0_0_20px_#3b82f6,0_0_30px_#3b82f6]" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
           </div>
           <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:rotate-12 transition-transform z-10">
              <span className="text-3xl">🏆</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-2 glass-card p-12 rounded-[4rem] border-blue-500/10 flex flex-col justify-between group overflow-hidden relative backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-start relative z-10 flex-wrap md:flex-nowrap gap-6">
             <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] mb-4">ACERTO MÉDIO</p>
                <h3 className="text-7xl md:text-[10rem] font-black text-white tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
                   {accuracy}<span className="text-blue-400 text-4xl md:text-6xl font-light">%</span>
                </h3>
             </div>
             <div className="w-44 h-44 min-w-[176px] min-h-[176px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                </div>
             </div>
          </div>
          
          {/* Main Lightsaber XP Bar */}
          <div className="mt-16 space-y-8 relative z-10">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PROGRESSO DE RANK</p>
                   <p className="text-xs font-black text-zinc-300 uppercase">{xpInLevel} / 1000 XP</p>
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">FALTAM {xpToNext} XP PARA RANK {level+1}</span>
             </div>
             
             {/* THE LIGHTSABER PROGRESS BAR */}
             <div className="h-6 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px] shadow-inner relative group/saber">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden" 
                  style={{ 
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {/* Lightsaber Core (White center) */}
                  <div className="absolute top-1/2 left-0 w-full h-[30%] -translate-y-1/2 bg-white/90 blur-[1px] rounded-full shadow-[0_0_8px_#fff]"></div>
                  
                  {/* Energy Flicker Animation Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-20 animate-[shimmer_2s_infinite] skew-x-[-20deg]"></div>
                </div>
                
                {/* Outer hum/glow effect around the bar container */}
                <div className="absolute inset-0 rounded-full pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.1)] group-hover/saber:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow"></div>
             </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="glass-card p-12 rounded-[3.5rem] border-zinc-900 flex flex-col justify-center gap-4 group hover:border-blue-400/50 transition-all backdrop-blur-xl hover:scale-[1.03] shadow-xl">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-2xl">⚡</span>
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">QUESTÕES</p>
          <p className="text-7xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">{total}</p>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-bold text-zinc-600 uppercase">Volume Operacional</p>
          </div>
        </div>

        <div className="glass-card p-12 rounded-[3.5rem] border-zinc-900 flex flex-col justify-center gap-4 group hover:border-emerald-400/50 transition-all backdrop-blur-xl hover:scale-[1.03] shadow-xl">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-2xl">🎯</span>
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">ACERTOS</p>
          <p className="text-7xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter">{correct}</p>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-bold text-zinc-600 uppercase">Aproveitamento Real</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Bar Chart */}
        <div className="lg:col-span-2 glass-card p-14 rounded-[4rem] border-zinc-900 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-16">
            <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em]">HISTÓRICO POR CATEGORIA (%)</h3>
            <div className="flex gap-4">
               <div className="px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-[9px] font-black text-blue-400 uppercase">TAXA DE ÊXITO</div>
            </div>
          </div>
          <div className="w-full h-80 min-h-[320px]">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
               <BarChart data={subjectData}>
                 <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#1a1a1a" />
                 <XAxis dataKey="name" stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} dy={15} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '24px', fontSize: '11px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
                 />
                 <Bar dataKey="accuracy" fill="#3b82f6" radius={[12, 12, 4, 4]} barSize={44} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Level Badge System */}
        <div className="bg-zinc-950 p-14 rounded-[4rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-10 group relative overflow-hidden">
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="w-40 h-40 bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] flex items-center justify-center border border-white/5 shadow-3xl relative group">
              <span className="text-8xl group-hover:scale-125 transition-all duration-700 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">🔥</span>
              <div className="absolute -top-4 -right-4 bg-blue-500 w-14 h-14 rounded-2xl border-4 border-zinc-950 flex items-center justify-center text-xl font-black text-white shadow-2xl rotate-12">{level}</div>
           </div>
           <div>
              <h4 className="text-3xl font-black text-white uppercase tracking-tighter">ESTADO DE FLOW</h4>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4">Sequência de Foco Ininterrupto</p>
           </div>
           <div className="flex gap-2 w-full justify-center">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className={`h-12 w-full rounded-2xl border transition-all duration-700 ${i <= 7 ? 'bg-blue-600/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-zinc-950 border-zinc-900'}`}></div>
              ))}
           </div>
        </div>
      </div>

      {/* Premium Suggested Task */}
      <div className="glass-card p-10 rounded-[3rem] border-zinc-900 flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:bg-blue-400/[0.03] transition-all backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden relative">
         <div className="absolute left-0 top-0 w-2 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-all"></div>
         <div className="flex items-center gap-10">
            <div className="w-20 h-20 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-2xl relative">
               👑
               <div className="absolute inset-0 bg-blue-400/10 rounded-3xl animate-pulse"></div>
            </div>
            <div className="text-center md:text-left">
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2">DESAFIO PREMIUM ATIVO</p>
               <p className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">PROVA INTEGRADA: DIREITO CONSTITUCIONAL</p>
               <p className="text-[10px] font-bold text-zinc-600 uppercase mt-1">Recompensa: +250 XP Cognitivo</p>
            </div>
         </div>
         <button 
            onClick={() => setActiveTab('simulator')}
            className="mt-6 md:mt-0 px-10 py-5 bg-blue-600 rounded-2xl font-black text-xs text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 btn-click-effect border-none cursor-pointer"
          >
            ACEITAR DESAFIO
         </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(500%) skewX(-20deg); }
        }
      `}} />
    </div>
  );
};

export default Dashboard;
