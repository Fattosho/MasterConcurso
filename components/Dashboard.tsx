
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { UserPerformance, UserProfile } from '../types';
import { KIWIFY_CONFIG, API_LIMIT_CONFIG } from '../services/supabaseClient';

interface DashboardProps { 
  performance: UserPerformance; 
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  profile?: UserProfile;
  onProfileUpdate?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ performance, setActiveTab, theme, profile, onProfileUpdate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const correct = performance.correctAnswers || 0;
  const total = performance.totalAnswered || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const xp = performance.xp || 0;
  const level = performance.level || Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const progressPercent = (xpInLevel / 1000) * 100;

  const isSubscriber = profile?.is_active_subscriber === true;
  const usageAmount = profile?.monthly_api_usage ?? 0;
  const trialPercent = (usageAmount / API_LIMIT_CONFIG.TRIAL_LIMIT_BRL) * 100;

  const chartColors = theme === 'dark' 
    ? { primary: '#3b82f6', empty: '#18181b' }
    : { primary: '#2563eb', empty: '#f1f5f9' };

  const chartData = [
    { name: 'Acertos', value: correct, color: chartColors.primary },
    { name: 'Resto', value: Math.max(0, total - correct), color: chartColors.empty },
  ];

  const handleSyncStatus = async () => {
    setIsSyncing(true);
    try {
      if (onProfileUpdate) await onProfileUpdate();
    } catch (e) { console.error("Erro na sincronização:", e); }
    setTimeout(() => setIsSyncing(false), 800);
  };

  const cardBase = "glass-card p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border transition-all duration-500 group relative overflow-hidden";

  return (
    <div className="space-y-6 md:space-y-10 page-transition">
      {/* STATUS BAR - DESIGN MOBILE-FIRST */}
      <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border flex items-center justify-between gap-2 ${
        theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSubscriber ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]'}`}></div>
          <div className="text-left overflow-hidden">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest truncate">Status da Identidade</p>
            <p className="text-[10px] md:text-xs font-bold text-blue-500 truncate max-w-[120px] md:max-w-none">{profile?.email || 'Sincronizando...'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Plano Ativo</p>
            <p className={`text-[10px] font-black uppercase ${isSubscriber ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isSubscriber ? 'MASTER PREMIUM' : 'MODO TRIAL'}
            </p>
          </div>
          <button 
            onClick={handleSyncStatus}
            disabled={isSyncing}
            className={`p-2.5 rounded-xl border border-white/5 transition-all hover:bg-blue-600/10 active:scale-90 ${isSyncing ? 'opacity-50' : ''}`}
            title="Sincronizar Assinatura"
          >
            <span className={isSyncing ? 'animate-spin block' : 'block'}>🔄</span>
          </button>
        </div>
      </div>

      {/* AVISO DE TRIAL / UPGRADE - FORMATADO PARA MOBILE */}
      {!isSubscriber && (
        <div className={`p-6 md:p-8 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-5 ${
          theme === 'dark' ? 'bg-amber-600/5 border-amber-600/20' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
            <div className="hidden md:flex w-14 h-14 bg-amber-600/20 rounded-2xl items-center justify-center text-2xl">⌛</div>
            <div className="flex-1 w-full">
              <h4 className="font-black text-[10px] md:text-xs uppercase tracking-widest text-amber-600">Acesso Experimental Ativado</h4>
              <p className={`text-[9px] md:text-[10px] font-bold mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                Seu limite de processamento gratuito está em {Math.min(trialPercent, 100).toFixed(0)}%.
              </p>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${Math.min(trialPercent, 100)}%` }}></div>
              </div>
            </div>
          </div>
          <a 
            href={KIWIFY_CONFIG.SUBSCRIPTION_LINK} 
            target="_blank" 
            className="w-full md:w-auto px-10 py-4 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg active:scale-95 transition-all"
          >
            💎 DESBLOQUEAR PREMIUM
          </a>
        </div>
      )}

      {/* GRID DE MÉTRICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* CARD PRINCIPAL DE PRECISÃO */}
        <div className={`${cardBase} lg:col-span-8`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 relative z-10">
             <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">PRECISÃO TÉCNICA</p>
                <h3 className="text-6xl md:text-9xl font-black tracking-tighter leading-none glow-text">
                   {accuracy}<span className="text-blue-600 text-2xl md:text-4xl font-light">%</span>
                </h3>
             </div>
             
             <div className="w-36 h-36 md:w-56 md:h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={6}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎯</div>
             </div>
          </div>
          
          <div className="mt-8 md:mt-16 space-y-4">
             <div className="flex justify-between items-end px-1">
                <span className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">XP: {xpInLevel}/1000</span>
                <span className="text-[11px] md:text-sm font-black text-blue-600">RANK ELITE LV.{level}</span>
             </div>
             <div className={`h-3.5 md:h-4 w-full rounded-full p-1 border ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <div className="h-full rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
             </div>
          </div>
        </div>

        {/* CARDS LATERAIS (MÉTRICAS RÁPIDAS) */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-8">
           <div className={cardBase}>
              <p className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOTAL RESOLVIDO</p>
              <p className="text-2xl md:text-5xl font-black italic">{total}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-6xl">📊</div>
           </div>
           
           <div className={cardBase}>
              <p className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">RESPOSTAS CERTAS</p>
              <p className="text-2xl md:text-5xl font-black text-emerald-500 italic">{correct}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 text-6xl text-emerald-500">✅</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
