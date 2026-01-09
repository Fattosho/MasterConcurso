import React, { useState } from 'react';
import { Materia, Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';

const Flashcards: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [materia, setMateria] = useState<Materia>('Direito Constitucional');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  const handleStart = async () => {
    setLoading(true);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const result = await generateFlashcards(materia);
      setFlashcards(result);
    } catch (e) { alert("Erro ao gerar flashcards."); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-transition space-y-12 pb-20 max-w-4xl mx-auto">
      <header className="border-l-4 border-blue-600 pl-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">REVISÃO <span className="text-blue-600">FLASH</span></h2>
        <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-xs mt-2 uppercase tracking-widest`}>Memória de Longo Prazo via Active Recall.</p>
      </header>

      {!flashcards.length && !loading ? (
        <div className={`glass-card p-12 rounded-[3.5rem] border space-y-10 text-center animate-in fade-in duration-700 ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="text-left">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">SELECIONE A ÁREA</label>
              <select 
                value={materia} 
                onChange={(e) => setMateria(e.target.value as Materia)}
                className={`w-full p-6 rounded-2xl border font-black text-xs uppercase tracking-widest focus:border-blue-500 outline-none appearance-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                {materias.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest btn-click-effect shadow-xl shadow-blue-600/20">GERAR SESSÃO</button>
          </div>
          <div className="pt-10 opacity-30 flex flex-col items-center">
             <span className="text-7xl mb-6">🗂️</span>
             <p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Início de Ciclo</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-40 animate-in fade-in duration-1000 space-y-12">
           <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-6xl animate-pulse">✨</span>
              </div>
           </div>
           <div className="text-center">
              <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.6em] animate-pulse">CALIBRANDO MEMÓRIA</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-2">Sincronizando Módulos de Cognição Ativa...</p>
           </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className={`p-6 rounded-[2rem] border flex justify-between items-center ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SESSÃO ATIVA: {materia}</span>
             <span className="text-xs font-black text-blue-600">{currentIndex + 1} / {flashcards.length}</span>
          </div>

          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group [perspective:2000px] h-[400px] w-full cursor-pointer"
          >
            <div className={`relative h-full w-full rounded-[4rem] transition-all duration-700 [transform-style:preserve-3d] shadow-3xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className={`absolute inset-0 rounded-[4rem] border-2 flex flex-col items-center justify-center p-16 text-center [backface-visibility:hidden] ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-3xl font-black leading-tight uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{flashcards[currentIndex].front}</h3>
                <p className="absolute bottom-10 text-[9px] font-black text-zinc-500 uppercase tracking-widest">TOQUE PARA REVELAR</p>
              </div>
              <div className="absolute inset-0 bg-blue-600 rounded-[4rem] border-2 border-blue-400 flex flex-col items-center justify-center p-16 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{flashcards[currentIndex].back}</h3>
                <p className="absolute bottom-10 text-[9px] font-black text-white/60 uppercase tracking-widest">DEFINIÇÃO TÉCNICA</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6">
             <button 
               onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }}
               disabled={currentIndex === 0}
               className={`w-20 h-20 rounded-[2rem] border flex items-center justify-center text-2xl disabled:opacity-20 btn-click-effect shadow-xl ${theme === 'dark' ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
             >
                ⬅️
             </button>
             <button 
               onClick={() => {
                 if (currentIndex < flashcards.length - 1) { setCurrentIndex(currentIndex + 1); setIsFlipped(false); }
                 else { setFlashcards([]); }
               }}
               className="px-14 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 btn-click-effect shadow-2xl shadow-blue-600/20"
             >
               {currentIndex === flashcards.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;