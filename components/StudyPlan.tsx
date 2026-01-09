import React, { useState } from 'react';
import { Materia, StudyPlanDay } from '../types';
import { generateStudyPlan } from '../services/geminiService';

const StudyPlan: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
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

  const cardClasses = `glass-card p-10 rounded-[3rem] border grid grid-cols-1 md:grid-cols-3 gap-8 items-end shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`;

  return (
    <div className="page-transition space-y-12 pb-20 max-w-5xl mx-auto">
      <header className="border-l-4 border-blue-600 pl-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">ESTRATÉGIA DE <span className="text-blue-600">CICLO</span></h2>
        <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-xs mt-2 uppercase tracking-widest`}>Otimização de tempo baseada em densidade de edital.</p>
      </header>

      <div className={cardClasses}>
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">DISCIPLINA ALVO</label>
          <select 
            value={materia} 
            onChange={(e) => setMateria(e.target.value as Materia)}
            className={`w-full p-6 rounded-2xl border text-xs font-black uppercase outline-none focus:border-blue-500 appearance-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
          >
            {materias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">HORAS</label>
          <input 
            type="number" 
            value={hours} 
            onChange={(e) => setHours(Number(e.target.value))}
            className={`w-full p-6 rounded-2xl border text-xs font-black outline-none focus:border-blue-500 text-center ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
          />
        </div>
        <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white h-[66px] rounded-2xl font-black text-xs uppercase tracking-widest btn-click-effect shadow-xl shadow-blue-600/20">
          {loading ? 'CALCULANDO...' : 'PROJETAR CICLO'}
        </button>
      </div>

      {plan.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-12 duration-1000">
           {plan.map((item, idx) => (
             <div key={idx} className={`p-12 rounded-[3.5rem] border relative group hover:border-blue-600/50 transition-all shadow-xl ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-900' : 'bg-white border-slate-200'}`}>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">{item.period}</p>
                <h4 className={`text-2xl font-black leading-tight mb-6 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.activity}</h4>
                <div className="pt-6 border-t border-zinc-900/10">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">FOCO TÉCNICO</p>
                   <p className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>{item.focus}</p>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;