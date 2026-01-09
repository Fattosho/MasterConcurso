import React, { useState } from 'react';
import { Materia, MnemonicResponse } from '../types';
import { generateMnemonic } from '../services/geminiService';

const MnemonicGenerator: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [materia, setMateria] = useState<Materia>('Direito Administrativo');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState<MnemonicResponse | null>(null);

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
    setMnemonic(null);
    try {
      const result = await generateMnemonic(materia);
      setMnemonic(result);
    } catch (e) {
      alert("Falha na síntese.");
    } finally {
      setLoading(false);
    }
  };

  const cardClasses = `glass-card p-8 md:p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`;

  return (
    <div className="page-transition max-w-4xl mx-auto space-y-12 pb-20">
      <header className="border-l-4 border-blue-600 pl-6">
        <h2 className="text-4xl font-black uppercase tracking-tighter">SISTEMA <span className="text-blue-600">MNÊMICO</span></h2>
        <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-xs uppercase tracking-widest mt-1`}>Ancoragem e Memorização Técnica</p>
      </header>

      <div className={`${cardClasses} flex flex-wrap gap-8 items-end`}>
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">DISCIPLINA FOCO</label>
          <select 
            value={materia} 
            onChange={(e) => setMateria(e.target.value as Materia)}
            className={`w-full p-5 rounded-2xl border outline-none cursor-pointer font-black text-[11px] uppercase tracking-widest appearance-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
          >
            {materias.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto px-12 h-[62px] bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] btn-click-effect shadow-xl shadow-blue-600/20 disabled:opacity-30"
        >
          {loading ? 'SINTETIZANDO...' : 'SINTETIZAR AGORA'}
        </button>
      </div>

      {!mnemonic && !loading && (
        <div className={`h-80 border rounded-[3rem] flex flex-col items-center justify-center text-center p-12 opacity-30 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-50 border-slate-100'}`}>
          <span className="text-8xl mb-8">🧠</span>
          <p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Processamento</p>
        </div>
      )}

      {mnemonic && (
        <div className={`p-12 md:p-20 rounded-[4rem] border space-y-12 animate-in zoom-in duration-700 relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-900 border-blue-500/10' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="space-y-4">
            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.5em]">ANCORAGEM CRÍTICA</span>
            <h3 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{mnemonic.phrase}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-zinc-900/10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">DECODIFICAÇÃO</h4>
              <p className={`text-lg font-bold leading-relaxed p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>{mnemonic.meaning}</p>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">FUNDAMENTO</h4>
              <p className={`text-sm leading-relaxed italic border-l-2 border-zinc-800 pl-10 py-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>{mnemonic.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MnemonicGenerator;