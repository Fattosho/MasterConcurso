
import React, { useState, useEffect, useRef } from 'react';
import { Banca, Materia, Nivel, Question } from '../types';
import { generateQuestion } from '../services/geminiService';

interface SimulatorProps { onQuestionAnswered: (isCorrect: boolean, subject: string) => void; }

const Simulator: React.FC<SimulatorProps> = ({ onQuestionAnswered }) => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [materia, setMateria] = useState<Materia>('Língua Portuguesa');
  const [nivel, setNivel] = useState<Nivel>('Superior');
  
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);

  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedbackEffect, setFeedbackEffect] = useState<'correct' | 'wrong' | null>(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionsAnsweredInSession, setQuestionsAnsweredInSession] = useState(0);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [totalSessionTimeTaken, setTotalSessionTimeTaken] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon', 'Fundatec'
  ];

  const materias: Materia[] = [
    'Língua Portuguesa', 'Matemática', 'Raciocínio Lógico', 'Informática', 
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal'
  ];

  useEffect(() => {
    if (isSessionActive && timeLeft > 0 && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSessionActive, timeLeft, isGameOver]);

  const handleGameOver = () => {
    const finalTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    setTotalSessionTimeTaken(finalTime);
    setIsGameOver(true);
    setIsSessionActive(false);
    setCurrentQuestion(null);
    setNextQuestion(null);
    setShowExplanation(false);
  };

  const startSession = async () => {
    setLoading(true);
    setIsGameOver(false);
    setQuestionsAnsweredInSession(0);
    setCorrectInSession(0);
    setTotalSessionTimeTaken(0);
    setTimeLeft(timeLimitMinutes * 60);
    sessionStartTimeRef.current = Date.now();

    try {
      const q = await generateQuestion(banca, materia, nivel);
      setCurrentQuestion(q);
      setIsSessionActive(true);
      prefetchNext(banca, materia, nivel);
    } catch (e) {
      alert("ERRO AO GERAR QUESTÃO. TENTE NOVAMENTE.");
    } finally {
      setLoading(false);
    }
  };

  const prefetchNext = async (currentBanca: Banca, currentMateria: Materia, currentNivel: Nivel) => {
    if (questionsAnsweredInSession + 1 >= questionCount) return;
    setIsPrefetching(true);
    try {
      const q = await generateQuestion(currentBanca, currentMateria, currentNivel);
      setNextQuestion(q);
    } catch (e) {
      console.error("Erro no prefetch", e);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleAnswer = (opt: string) => {
    if (showExplanation || !currentQuestion) return;
    const isCorrect = opt === currentQuestion.correctAnswerId;
    
    setQuestionsAnsweredInSession(prev => prev + 1);
    if (isCorrect) setCorrectInSession(prev => prev + 1);

    setSelectedOption(opt);
    setShowExplanation(true);
    setFeedbackEffect(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setFeedbackEffect(null), 1000);
    onQuestionAnswered(isCorrect, materia);
  };

  const nextOrFinish = async () => {
    if (questionsAnsweredInSession >= questionCount) {
      handleGameOver();
      return;
    }

    setShowExplanation(false);
    setSelectedOption(null);

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      prefetchNext(banca, materia, nivel);
    } else {
      setLoading(true);
      try {
        const q = await generateQuestion(banca, materia, nivel);
        setCurrentQuestion(q);
        prefetchNext(banca, materia, nivel);
      } catch (e) {
        alert("Erro ao carregar questão.");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const avgTime = questionsAnsweredInSession > 0 
    ? (totalSessionTimeTaken || (timeLimitMinutes * 60 - timeLeft)) / questionsAnsweredInSession 
    : 0;

  return (
    <div className="page-transition max-w-5xl mx-auto space-y-10 pb-16 relative">
      {/* Visual Feedback Flash */}
      {feedbackEffect === 'correct' && <div className="fixed inset-0 bg-emerald-500/10 pointer-events-none z-[100] animate-in fade-in fade-out duration-1000"></div>}
      {feedbackEffect === 'wrong' && <div className="fixed inset-0 bg-rose-500/10 pointer-events-none z-[100] animate-in fade-in fade-out duration-1000"></div>}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-blue-600 pl-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">SIMULADOR <span className="text-blue-500">MASTER</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1">Treinamento Intensivo Personalizado</p>
        </div>
        
        {isSessionActive && (
          <div className="flex gap-4">
             <div className="glass-card px-8 py-3 rounded-2xl border-blue-500/20 text-center backdrop-blur-md">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">PROGRESSO</p>
                <p className="text-xl font-black text-white">{questionsAnsweredInSession} / {questionCount}</p>
             </div>
             <div className={`glass-card px-8 py-3 rounded-2xl text-center border-zinc-800 backdrop-blur-md ${timeLeft < 60 ? 'border-rose-500 animate-pulse' : ''}`}>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">TEMPO</p>
                <p className="text-xl font-black text-white font-mono">{formatTime(timeLeft)}</p>
             </div>
          </div>
        )}
      </header>

      {loading && !isSessionActive && (
        <div className="flex flex-col items-center justify-center py-32 space-y-12 animate-in fade-in duration-500">
           <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[60px] animate-pulse"></div>
              <div className="w-44 h-44 flex items-center justify-center relative z-10">
                 <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
                   <path d="M50 25 C 30 25, 20 40, 20 55 C 20 70, 30 80, 50 80 C 70 80, 80 70, 80 55 C 80 40, 70 25, 50 25 Z" fill="none" stroke="#3b82f6" strokeWidth="2" className="opacity-40" />
                   <path d="M50 25 V 80 M20 55 H 80" stroke="#3b82f6" strokeWidth="1" className="opacity-20" />
                   <circle cx="50" cy="50" r="10" fill="#3b82f6" className="animate-ping" />
                 </svg>
                 <span className="absolute text-5xl">🧠</span>
              </div>
           </div>
           <div className="text-center space-y-2">
              <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.6em] animate-pulse">Sintonizando Questões Inéditas</p>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Analisando padrão da banca {banca}...</p>
           </div>
        </div>
      )}

      {!isSessionActive && !isGameOver && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-card p-10 rounded-[3rem] border-zinc-900/50 shadow-2xl backdrop-blur-md">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">BANCA</label>
            <select value={banca} onChange={e => setBanca(e.target.value as Banca)} className="w-full bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              {bancas.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">DISCIPLINA</label>
            <select value={materia} onChange={e => setMateria(e.target.value as Materia)} className="w-full bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              {materias.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">NÍVEL</label>
            <select value={nivel} onChange={e => setNivel(e.target.value as Nivel)} className="w-full bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 uppercase appearance-none">
              <option value="Médio">MÉDIO</option>
              <option value="Superior">SUPERIOR</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">QUESTÕES</label>
            <input type="number" value={questionCount} min="1" max="100" onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 text-center" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">TEMPO (M)</label>
            <input type="number" value={timeLimitMinutes} min="1" max="240" onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all text-zinc-300 text-center" />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button onClick={startSession} className="w-full h-[62px] neon-button-solid text-white rounded-2xl font-black text-[11px] uppercase tracking-widest btn-click-effect">INICIAR</button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="glass-card p-16 rounded-[4rem] text-center border-blue-500/20 animate-in zoom-in duration-700 shadow-2xl space-y-12 backdrop-blur-sm">
           <div className="space-y-4">
              <div className="text-7xl mb-8">🎯</div>
              <h3 className="text-5xl font-black text-white uppercase tracking-tighter">SIMULADO FINALIZADO</h3>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.6em]">Processamento de Resultado Concluído</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-800 shadow-inner group hover:border-zinc-600 transition-colors">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">TOTAL</p>
                 <p className="text-5xl font-black text-white group-hover:scale-110 transition-transform">{questionsAnsweredInSession}</p>
              </div>
              <div className="bg-emerald-500/5 p-10 rounded-[2.5rem] border border-emerald-500/20 shadow-inner group hover:border-emerald-500/40 transition-colors">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">ACERTOS</p>
                 <p className="text-5xl font-black text-emerald-400 group-hover:scale-110 transition-transform">{correctInSession}</p>
              </div>
              <div className="bg-blue-600/5 p-10 rounded-[2.5rem] border border-blue-600/20 shadow-inner group hover:border-blue-600/40 transition-colors">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">VELOCIDADE</p>
                 <p className="text-5xl font-black text-blue-400 group-hover:scale-110 transition-transform">{avgTime.toFixed(1)}s</p>
              </div>
           </div>

           <button onClick={() => setIsGameOver(false)} className="neon-button-blue px-20 py-7 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] btn-click-effect">REINICIAR TESTE</button>
        </div>
      )}

      {isSessionActive && currentQuestion && (
        <div className={`glass-card p-10 md:p-16 rounded-[3.5rem] space-y-12 animate-in slide-in-from-bottom-8 duration-700 border-blue-500/5 shadow-2xl relative overflow-hidden backdrop-blur-md ${feedbackEffect === 'wrong' ? 'animate-shake' : ''}`}>
           <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest">
              <span className="bg-zinc-900 border border-zinc-800 px-6 py-2.5 rounded-full text-zinc-400">{currentQuestion.banca}</span>
              <span className="bg-blue-600/10 border border-blue-500/20 px-6 py-2.5 rounded-full text-blue-500">{currentQuestion.materia}</span>
              <span className="bg-zinc-900/80 border border-zinc-800 px-6 py-2.5 rounded-full text-zinc-500">QUESTÃO {questionsAnsweredInSession + 1}</span>
           </div>

           <div className="space-y-12">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-zinc-100 tracking-tight">{currentQuestion.statement}</h2>
              <div className="grid grid-cols-1 gap-5">
                {currentQuestion.options.map(opt => {
                  const isCorrect = opt.id === currentQuestion.correctAnswerId;
                  const isSelected = selectedOption === opt.id;
                  let styleClass = "bg-zinc-900/30 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50";
                  if (showExplanation) {
                    if (isCorrect) styleClass = "bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold shadow-[0_0_30px_rgba(16,185,129,0.1)]";
                    else if (isSelected) styleClass = "bg-rose-500/10 border-rose-500/60 text-rose-400 opacity-80";
                    else styleClass = "opacity-20 blur-[2px]";
                  }
                  return (
                    <button 
                      key={opt.id} 
                      onClick={() => handleAnswer(opt.id)} 
                      disabled={showExplanation} 
                      className={`w-full p-7 rounded-[2rem] border transition-all flex gap-8 text-left group btn-click-effect relative overflow-hidden ${styleClass}`}
                    >
                      <span className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl border text-[12px] font-black transition-all ${
                        showExplanation && isCorrect 
                        ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg' 
                        : isSelected && !isCorrect ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="text-sm md:text-[17px] font-medium flex-1 self-center leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
           </div>

           {showExplanation && (
             <div className="p-12 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-[3rem] space-y-8 animate-in fade-in zoom-in duration-700 shadow-inner">
               <div className="flex items-center gap-5">
                 <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                 <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em]">RESPOSTA COMENTADA</h4>
               </div>
               <p className="text-zinc-400 text-[15px] leading-relaxed italic border-l border-zinc-900 pl-10">{currentQuestion.explanation}</p>
               <div className="pt-8 flex justify-end">
                  <button 
                    onClick={nextOrFinish} 
                    className="neon-button-blue px-14 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-5"
                  >
                    {isPrefetching && !nextQuestion ? 'Gerando Próxima...' : questionsAnsweredInSession >= questionCount ? 'Finalizar' : 'Próxima'} 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Simulator;
