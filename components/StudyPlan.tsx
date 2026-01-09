
import React, { useState } from 'react';
import { Materia, StudyPlanDay } from '../types';
import { generateStudyPlan } from '../services/geminiService';

const StudyPlan: React.FC = () => {
  const [materia, setMateria] = useState<Materia>('Direito Administrativo');
  const [hours, setHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlanDay[]>([]);

  const materias: Materia[] = [
    'Língua Portuguesa', 'Matemática', 'Raciocínio Lógico', 'Informática', 
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 
    'Direito Processual Penal', 'Direito Civil', 'Direito Processual Civil', 
    'Direito Tributário', 'Direito Eleitoral', 'Direito do Trabalho', 
    'Direito Processual do Trabalho', 'Direito Previdenciário', 'Administração Pública', 
    'Administração Geral', 'Gestão de Pessoas', 'Contabilidade Geral', 
    'Contabilidade Pública', 'Auditoria', 'Estatística', 'Economia', 
    'Arquivologia', 'Ética no Serviço Público', 'Atualidades', 
    'Língua Inglesa', 'Língua Espanhola', 'Políticas Públicas'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateStudyPlan(materia, hours);
      setPlan(result);
    } catch (e) { alert("Erro ao gerar plano."); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-transition space-y-12 pb-20 max-w-5xl mx-auto">
      <header className="border-l-4 border-blue-400 pl-8">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">ESTRATÉGIA DE <span className="text-blue-400">CICLO</span></h2>
        <p className="text-zinc-500 font-bold text-xs mt-2 uppercase tracking-widest">Otimização de tempo baseada em densidade de edital.</p>
      </header>

      <div className="glass-card p-10 rounded-[3rem] border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-8 items-end shadow-2xl backdrop-blur-xl">
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">DISCIPLINA ALVO</label>
          <select 
            value={materia} 
            onChange={(e) => setMateria(e.target.value as Materia)}
            className="w-full bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-xs font-black text-zinc-300 uppercase outline-none focus:border-blue-400 appearance-none"
          >
            {materias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">HORAS DISPONÍVEIS</label>
          <input 
            type="number" 
            value={hours} 
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-xs font-black text-zinc-300 outline-none focus:border-blue-400 text-center"
          />
        </div>
        <button onClick={handleGenerate} disabled={loading} className="neon-button-solid text-white h-[66px] rounded-2xl font-black text-xs uppercase tracking-widest btn-click-effect shadow-xl">
          {loading ? 'CALCULANDO...' : 'PROJETAR CICLO'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-40 animate-in fade-in duration-1000 space-y-12">
           <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-2 border-blue-500/20 rounded-xl rotate-45 animate-[spin_4s_linear_infinite]"></div>
              <div className="absolute inset-0 border-2 border-blue-500/40 rounded-xl -rotate-45 animate-[spin_6s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-4 h-4 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] rounded-sm animate-pulse"></div>
              </div>
           </div>
           <div className="text-center">
              <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.5em] animate-pulse">ALINHANDO MATRIZ</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-2">Distribuindo carga horária via Gemini Strategy...</p>
           </div>
        </div>
      ) : plan.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-12 duration-1000">
           {plan.map((item, idx) => (
             <div key={idx} className="glass-card p-12 rounded-[3.5rem] border-zinc-900 relative group hover:border-blue-400/50 transition-all shadow-xl">
                <div className="absolute top-0 right-0 p-8 text-5xl opacity-5 group-hover:opacity-10 transition-opacity">
                   {idx === 0 ? '🌅' : idx === 1 ? '☀️' : '🌙'}
                </div>
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">{item.period}</p>
                <h4 className="text-2xl font-black text-white leading-tight mb-6 uppercase tracking-tight">{item.activity}</h4>
                <div className="pt-6 border-t border-zinc-900">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">FOCO TÉCNICO</p>
                   <p className="text-xs text-zinc-400 font-bold uppercase">{item.focus}</p>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
