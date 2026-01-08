
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserPerformance } from '../types';

interface DashboardProps { performance: UserPerformance; }

const Dashboard: React.FC<DashboardProps> = ({ performance }) => {
  const correct = performance.correctAnswers || 0;
  const total = performance.totalAnswered || 0;
  const stats: Record<string, { total: number; correct: number }> = performance.subjectStats || {};
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const chartData = [
    { name: 'Corretas', value: correct, color: '#3b82f6' },
    { name: 'Restante', value: Math.max(0, total - correct), color: '#18181b' },
  ];

  const subjectData = Object.entries(stats).map(([name, stat]) => ({
    name: name.split(' ').map(w => w[0]).join(''),
    fullName: name,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
  })).slice(0, 6);

  const dailyGoal = 50;
  const progressToGoal = Math.min(100, (total / dailyGoal) * 100);

  return (
    <div className="page-transition space-y-10 pb-10 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">CENTRAL DE <span className="text-blue-500">COMANDO</span></h2>
          </div>
          <p className="text-zinc-600 font-bold text-xs uppercase tracking-[0.3em]">Painel de Controle e Gestão de Conhecimento</p>
        </div>
        
        <div className="flex items-center gap-6 bg-zinc-900/30 p-5 rounded-[2rem] border border-white/5 backdrop-blur-md">
           <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">SISTEMA ATIVO</p>
              <p className="text-xs font-black text-emerald-500">ESTABILIDADE ÓTIMA</p>
           </div>
           <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-2 glass-card p-12 rounded-[3.5rem] border-blue-500/10 flex flex-col justify-between group overflow-hidden relative backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="flex justify-between items-start relative z-10">
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">SCORE COGNITIVO</p>
                <h3 className="text-8xl font-black text-white tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-1000">
                   {accuracy}<span className="text-blue-500 text-5xl font-light">%</span>
                </h3>
             </div>
             <div className="w-36 h-36 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-1000" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          
          <div className="mt-12 space-y-6 relative z-10">
             <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                <span>PROGRESSO DIÁRIO</span>
                <span className="text-blue-500">{total}/{dailyGoal} QUESTÕES</span>
             </div>
             <div className="h-3 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progressToGoal}%` }}></div>
             </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="glass-card p-10 rounded-[3rem] border-zinc-900 flex flex-col justify-center gap-3 group hover:border-blue-500/30 transition-all backdrop-blur-md hover:scale-[1.02]">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-2">
             <span className="text-xl">📊</span>
          </div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">RESOLVIDAS</p>
          <p className="text-6xl font-black text-white group-hover:text-blue-500 transition-colors">{total}</p>
          <p className="text-[10px] font-bold text-zinc-700 uppercase">Volume Histórico</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-zinc-900 flex flex-col justify-center gap-3 group hover:border-emerald-500/30 transition-all backdrop-blur-md hover:scale-[1.02]">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-2">
             <span className="text-xl">✅</span>
          </div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">TAXA DE ACERTO</p>
          <p className="text-6xl font-black text-white group-hover:text-emerald-500 transition-colors">{correct}</p>
          <p className="text-[10px] font-bold text-zinc-700 uppercase">Acertos Líquidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Bar Chart */}
        <div className="lg:col-span-2 glass-card p-12 rounded-[3.5rem] border-zinc-900/50 overflow-hidden relative backdrop-blur-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">ANALÍTICO POR MATÉRIA (%)</h3>
            <div className="flex gap-3">
               <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
               <div className="w-3 h-3 bg-zinc-800 rounded-full"></div>
            </div>
          </div>
          <div className="w-full h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={subjectData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                 <XAxis dataKey="name" stroke="#3f3f46" fontSize={11} axisLine={false} tickLine={false} dy={15} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.03)' }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                 />
                 <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={38} className="transition-all duration-1000" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-gradient-to-br from-zinc-900/50 to-black p-12 rounded-[3.5rem] border border-blue-500/10 flex flex-col justify-center items-center text-center space-y-8 backdrop-blur-md">
           <div className="w-28 h-28 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl relative group">
              <span className="text-6xl transition-transform group-hover:scale-125 duration-500">🔥</span>
              <div className="absolute -top-3 -right-3 bg-blue-600 w-10 h-10 rounded-full border-4 border-zinc-950 flex items-center justify-center text-[12px] font-black text-white shadow-lg shadow-blue-600/30">7</div>
           </div>
           <div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">SEQUÊNCIA DE FOCO</h4>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-3">Mantenha o ritmo!</p>
           </div>
           <div className="grid grid-cols-7 gap-3 w-full pt-4">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className={`h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${i <= 7 ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-zinc-950/50 border-zinc-900'}`}>
                   <span className={`text-[9px] font-black ${i <= 7 ? 'text-blue-400' : 'text-zinc-800'}`}>D{i}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="glass-card p-8 rounded-[2rem] border-zinc-900 flex items-center justify-between group cursor-pointer hover:bg-blue-600/5 transition-all backdrop-blur-sm border-white/5">
         <div className="flex items-center gap-8">
            <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xl">🎯</div>
            <div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">PRÓXIMA META RECOMENDADA</p>
               <p className="text-base font-black text-white uppercase tracking-tight group-hover:text-blue-500 transition-colors">Simulado Especialista: Direito Administrativo</p>
            </div>
         </div>
         <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all shadow-lg">
            <svg className="w-5 h-5 text-zinc-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
