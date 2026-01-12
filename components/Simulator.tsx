
import React, { useState, useEffect, useRef } from 'react';
import { Banca, Materia, Nivel, Question } from '../types';
import { generateQuestion } from '../services/geminiService';

interface SimulatorProps { 
  onQuestionAnswered: (isCorrect: boolean, subject: string) => void; 
  theme: 'dark' | 'light';
}

const Simulator: React.FC<SimulatorProps> = ({ onQuestionAnswered, theme }) => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [materia, setMateria] = useState<Materia>('Língua Portuguesa');
  const [nivel, setNivel] = useState<Nivel>('Superior');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Fila de pré-carregamento
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const isPrefetching = useRef(false);

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

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon', 'Fundatec', 
    'FAURGS', 'Objetiva Concursos', 'FEPESE', 'NC/UFPR', 'IBAM', 'Gualimp', 
    'Consulplan', 'FUMARC', 'Comperve', 'Fadesp', 'Cetap', 'Consulpam', 
    'UPENET', 'Itame', 'IV/UFG', 'IDIB', 'Ivin', 'Instituto Acesso'
  ];

  // Função para manter a fila com 2 questões
  const prefetchQuestions = async (currentBanca: Banca, currentMateria: Materia, currentNivel: Nivel) => {
    if (isPrefetching.current || questionQueue.length >= 2) return;
    
    isPrefetching.current = true;
    try {
      while (questionQueue.length < 2) {
        const nextQ = await generateQuestion(currentBanca, currentMateria, currentNivel);
        setQuestionQueue(prev => [...prev, nextQ]);
      }
    } catch (e) {
      console.warn("Erro ao pre-carregar questão:", e);
    } finally {
      isPrefetching.current = false;
    }
  };

  const startSession = async () => {
    setLoading(true);
    setAnsweredCount(0);
    setQuestionQueue([]); // Limpa fila anterior
    try {
      // Carrega a primeira imediatamente
      const q = await generateQuestion(banca, materia, nivel);
      setCurrentQuestion(q);
      setIsSessionActive(true);
      
      // Inicia prefetch das próximas 2 em background
      prefetchQuestions(banca, materia, nivel);
    } catch (e: any) {
      alert(e.message || "Erro ao carregar questão.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optId: string) => {
    if (showExplanation) return;
    const isCorrect = optId === currentQuestion?.correctAnswerId;
    setSelectedOption(optId);
    setShowExplanation(true);
    setAnsweredCount(prev => prev + 1);
    onQuestionAnswered(isCorrect, materia);
    
    // Aproveita o tempo que o usuário está lendo a explicação para garantir o buffer
    prefetchQuestions(banca, materia, nivel);
  };

  const handleNext = async () => {
    if (answeredCount >= questionCount) {
      setIsSessionActive(false);
      setCurrentQuestion(null);
      setQuestionQueue([]);
      return;
    }

    setShowExplanation(false);
    setSelectedOption(null);

    // Verifica se temos questão na fila
    if (questionQueue.length > 0) {
      const nextFromQueue = questionQueue[0];
      setQuestionQueue(prev => prev.slice(1));
      setCurrentQuestion(nextFromQueue);
      
      // Gatilho para repor a fila
      prefetchQuestions(banca, materia, nivel);
    } else {
      // Fallback: Caso a fila esteja vazia (ex: internet lenta)
      setLoading(true);
      try {
        const q = await generateQuestion(banca, materia, nivel);
        setCurrentQuestion(q);
        prefetchQuestions(banca, materia, nivel);
      } catch (e: any) { 
        alert(e.message || "Falha na próxima questão."); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  const cardClasses = `glass-card p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border transition-all duration-500 shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`;

  return (
    <div className="space-y-6 md:space-y-10 page-transition pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 px-1">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter">Arena <span className="text-blue-600">Master</span></h2>
          <p className="text-zinc-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Protocolo de Treinamento IA</p>
        </div>
        {isSessionActive && (
          <div className="flex items-center gap-3">
            <div className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border border-blue-600/30 text-blue-500 ${questionQueue.length > 0 ? 'animate-pulse' : 'opacity-0'}`}>
              Buffer Ready ({questionQueue.length})
            </div>
            <div className="bg-blue-600 px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20">
              PROGRESSO: {answeredCount}/{questionCount}
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="py-32 md:py-40 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-600 text-[9px] font-black tracking-[0.4em] uppercase">Consultando Módulo Gemini...</p>
        </div>
      ) : !isSessionActive ? (
        <div className={cardClasses}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Banca Alvo</label>
              <select value={banca} onChange={e => setBanca(e.target.value as Banca)} className={`w-full p-4 rounded-xl border outline-none font-black text-[10px] md:text-xs uppercase transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {bancas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Disciplina</label>
              <select value={materia} onChange={e => setMateria(e.target.value as Materia)} className={`w-full p-4 rounded-xl border outline-none font-black text-[10px] md:text-xs uppercase transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {materias.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nível</label>
              <select value={nivel} onChange={e => setNivel(e.target.value as Nivel)} className={`w-full p-4 rounded-xl border outline-none font-black text-[10px] md:text-xs uppercase transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="Médio">Médio</option>
                <option value="Superior">Superior</option>
                <option value="Técnico">Técnico</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Quantidade</label>
              <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className={`w-full p-4 rounded-xl border outline-none font-black text-[10px] md:text-xs uppercase transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value={5}>05 Questões</option>
                <option value={10}>10 Questões</option>
                <option value={20}>20 Questões</option>
                <option value={30}>30 Questões</option>
              </select>
            </div>
          </div>
          <button onClick={startSession} className="w-full mt-8 bg-blue-600 text-white py-5 md:py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            INICIAR CICLO ELITE
          </button>
        </div>
      ) : currentQuestion && (
        <div className="space-y-6">
           <div className={cardClasses}>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <span className="bg-blue-600 text-white text-[7px] md:text-[8px] font-black px-3 py-1.5 rounded-full uppercase whitespace-nowrap">{currentQuestion.banca}</span>
                <span className="bg-zinc-800 text-zinc-400 text-[7px] md:text-[8px] font-black px-3 py-1.5 rounded-full uppercase whitespace-nowrap">{currentQuestion.materia}</span>
                <span className="bg-indigo-600 text-white text-[7px] md:text-[8px] font-black px-3 py-1.5 rounded-full uppercase whitespace-nowrap">NÍVEL {currentQuestion.nivel.toUpperCase()}</span>
              </div>

              <div className="space-y-6 md:space-y-8">
                <h3 className={`text-base md:text-2xl font-bold leading-relaxed tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
                  {currentQuestion.statement}
                </h3>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {currentQuestion.options.map(opt => {
                    const isCorrect = opt.id === currentQuestion.correctAnswerId;
                    const isSelected = selectedOption === opt.id;
                    let btnStyle = theme === 'dark' ? "border-white/5 bg-zinc-900/40" : "border-slate-200 bg-slate-50 text-slate-700";
                    
                    if (showExplanation) {
                      if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                      else if (isSelected) btnStyle = "border-rose-500 bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]";
                      else btnStyle = "opacity-30 border-transparent bg-transparent blur-[1px]";
                    }

                    return (
                      <button 
                        key={opt.id}
                        onClick={() => handleAnswer(opt.id)}
                        disabled={showExplanation}
                        className={`w-full text-left p-4 md:p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 active:scale-[0.98] focus:outline-none ${btnStyle}`}
                      >
                        <span className={`w-9 h-9 md:w-11 md:h-11 flex-shrink-0 flex items-center justify-center rounded-xl text-[11px] md:text-xs font-black border ${isSelected ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30' : 'border-zinc-800 text-zinc-500'}`}>{opt.id}</span>
                        <span className="text-[13px] md:text-base font-medium leading-tight pt-2.5">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showExplanation && (
                <div className={`mt-8 md:mt-12 p-6 md:p-10 rounded-3xl border animate-in slide-in-from-top-4 duration-500 ${theme === 'dark' ? 'bg-zinc-950 border-white/5 shadow-inner' : 'bg-slate-100 border-slate-200'}`}>
                  <p className="text-[8px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 italic">Decodificação da IA Master</p>
                  <p className={`text-xs md:text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>{currentQuestion.explanation}</p>
                  <button onClick={handleNext} className="w-full md:w-auto mt-8 bg-zinc-100 text-zinc-950 px-12 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-white active:scale-95 transition-all">
                    {answeredCount >= questionCount ? 'VER RESULTADOS' : 'PRÓXIMO DESAFIO'}
                  </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
