
import React, { useState } from 'react';
import { Materia, Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';

const Flashcards: React.FC = () => {
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
      <header className="border-l-4 border-blue-400 pl-8">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">REVISÃO <span className="text-blue-400">FLASH</span></h2>
        <p className="text-zinc-500 font-bold text-xs mt-2 uppercase tracking-widest">Memória de Longo Prazo via Active Recall.</p>
      </header>

      {!flashcards.length && !loading ? (
        <div className="glass-card p-12 rounded-[3.5rem] border-zinc-900 space-y-10 text-center animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="text-left">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">SELECIONE A ÁREA</label>
              <select 
                value={materia} 
                onChange={(e) => setMateria(e.target.value as Materia)}
                className="w-full bg-zinc-950 p-6 rounded-2xl border border-zinc-800 font-black text-xs text-zinc-300 uppercase tracking-widest focus:border-blue-400 outline-none appearance-none"
              >
                {materias.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={handleStart} className="neon-button-solid text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest btn-click-effect">GERAR SESSÃO</button>
          </div>
          <div className="pt-10 opacity-30 flex flex-col items-center">
             <span className="text-7xl mb-6 animate-float">🗂️</span>
             <p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Início de Ciclo</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-40 animate-in fade-in duration-1000 space-y-12">
           <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-cyber-pulse rounded-full"></div>
              {/* Floating neural particles */}
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 bg-blue-400 rounded-full animate-orbit"
                  style={{ animationDelay: `${i * 0.5}s`, opacity: 0.6 }}
                ></div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-6xl animate-pulse">✨</span>
              </div>
           </div>
           <div className="text-center">
              <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.6em] animate-pulse">CALIBRANDO MEMÓRIA</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-2">Sincronizando Módulos de Cognição Ativa...</p>
           </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SESSÃO ATIVA: {materia}</span>
             <span className="text-xs font-black text-blue-400">{currentIndex + 1} / {flashcards.length}</span>
          </div>

          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="group [perspective:2000px] h-[400px] w-full cursor-pointer"
          >
            <div className={`relative h-full w-full rounded-[4rem] transition-all duration-700 [transform-style:preserve-3d] shadow-3xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black rounded-[4rem] border-2 border-white/5 flex flex-col items-center justify-center p-16 text-center [backface-visibility:hidden]">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl opacity-20 group-hover:opacity-100 transition-opacity">❓</div>
                <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{flashcards[currentIndex].front}</h3>
                <p className="absolute bottom-10 text-[9px] font-black text-zinc-600 uppercase tracking-widest">TOQUE PARA REVELAR</p>
              </div>
              <div className="absolute inset-0 bg-blue-600 rounded-[4rem] border-2 border-blue-400 flex flex-col items-center justify-center p-16 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl text-white/40">💡</div>
                <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{flashcards[currentIndex].back}</h3>
                <p className="absolute bottom-10 text-[9px] font-black text-white/60 uppercase tracking-widest">DEFINIÇÃO TÉCNICA</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6">
             <button 
               onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }}
               disabled={currentIndex === 0}
               className="w-20 h-20 bg-zinc-900 rounded-[2rem] border border-white/5 flex items-center justify-center text-2xl hover:bg-zinc-800 disabled:opacity-20 btn-click-effect shadow-xl"
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
