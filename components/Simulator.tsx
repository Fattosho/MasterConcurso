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
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);

  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const timerRef = useRef<any>(null);

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon'
  ];

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

  const prefetchNext = async () => {
    if (answeredCount + 1 < questionCount) {
      try {
        const q = await generateQuestion(banca, materia, nivel);
        setNextQuestion(q);
      } catch (e) {
        console.error("Erro no prefetch:", e);
      }
    }
  };

  const startSession = async () => {
    setLoading(true);
    setIsGameOver(false);
    setAnsweredCount(0);
    setCorrectCount(0);
    setTimeLeft(timeLimitMinutes * 60);

    try {
      const q = await generateQuestion(banca, materia, nivel);
      setCurrentQuestion(q);
      setIsSessionActive(true);
      prefetchNext();
    } catch (e) {
      alert("Houve um problema na geração da questão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSessionActive && timeLeft > 0 && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsGameOver(true);
            setIsSessionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isSessionActive, timeLeft, isGameOver]);

  const handleAnswer = (optId: string) => {
    if (showExplanation) return;
    const isCorrect = optId === currentQuestion?.correctAnswerId;
    setSelectedOption(optId);
    setShowExplanation(true);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setAnsweredCount(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);
    onQuestionAnswered(isCorrect, materia);
  };

  const handleNext = async () => {
    if (answeredCount >= questionCount) {
      setIsGameOver(true);
      setIsSessionActive(false);
      return;
    }
    
    setLoading(true);
    setShowExplanation(false);
    setSelectedOption(null);
    setFeedback(null);
    
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      prefetchNext();
      setLoading(false);
    } else {
      try {
        const q = await generateQuestion(banca, materia, nivel);
        setCurrentQuestion(q);
        prefetchNext();
      } catch (e) { alert("Erro ao carregar próxima questão."); }
      finally { setLoading(false); }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cardClasses = `glass-card p-12 md:p-16 rounded-[4rem] border transition-all duration-700 shadow-3xl relative overflow-hidden ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 page-transition">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
             <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none glow-text`}>Arena de <span className="text-blue-600">Combate</span></h2>
          </div>
          <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} text-sm font-bold uppercase tracking-[0.3em] ml-6`}>Protocolo de Simulação Técnica</p>
        </div>
        
        {isSessionActive && (
          <div className="flex gap-6">
             <div className={`p-6 px-10 rounded-[2rem] border flex flex-col items-center ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 shadow-inner' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">SEQUÊNCIA</p>
                <p className="font-black text-2xl leading-none">{answeredCount} <span className="text-xs text-zinc-600 font-bold">/ {questionCount}</span></p>
             </div>
             <div className={`p-6 px-10 rounded-[2rem] border flex flex-col items-center min-w-[140px] ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 shadow-inner' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">CHRONOS</p>
                <p className={`font-mono font-black text-2xl leading-none ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-blue-600'}`}>{formatTime(timeLeft)}</p>
             </div>
          </div>
        )}
      </header>

      {!isSessionActive && !isGameOver && (
        <div className={cardClasses}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2">ORGANIZADORA</label>
              <select value={banca} onChange={e => setBanca(e.target.value as Banca)} className={`w-full p-6 rounded-[1.5rem] border outline-none focus:border-blue-600 transition-all font-black text-sm uppercase tracking-widest appearance-none shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {bancas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2">ÁREA DE CONHECIMENTO</label>
              <select value={materia} onChange={e => setMateria(e.target.value as Materia)} className={`w-full p-6 rounded-[1.5rem] border outline-none focus:border-blue-600 transition-all font-black text-sm uppercase tracking-widest appearance-none shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {materias.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2">CARGA DE QUESTÕES</label>
              <input 
                type="number" 
                min="1" max="50"
                value={questionCount} 
                onChange={e => setQuestionCount(Number(e.target.value))}
                className={`w-full p-6 rounded-[1.5rem] border outline-none focus:border-blue-600 transition-all font-black text-sm shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2">LIMITE TEMPORAL (MIN)</label>
              <input 
                type="number" 
                min="1" max="300"
                value={timeLimitMinutes} 
                onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                className={`w-full p-6 rounded-[1.5rem] border outline-none focus:border-blue-600 transition-all font-black text-sm shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              />
            </div>
          </div>
          <button 
            onClick={startSession} 
            disabled={loading} 
            className="group relative w-full mt-12 bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(37,99,235,0.4)] overflow-hidden"
          >
            <span className="relative z-10">{loading ? 'CONECTANDO ÀS BASES DE DADOS...' : 'INICIAR PROTOCOLO'}</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      )}

      {isSessionActive && currentQuestion && (
        <div className="space-y-10">
           <div className={`${cardClasses} ${feedback === 'wrong' ? 'border-rose-500/30 ring-4 ring-rose-500/10' : feedback === 'correct' ? 'border-emerald-500/30 ring-4 ring-emerald-500/10' : ''}`}>
              <div className="flex flex-wrap gap-4 mb-10">
                <span className="bg-blue-600 text-white text-[9px] font-black px-6 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">{currentQuestion.banca}</span>
                <span className={`${theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-500'} text-[9px] font-black px-6 py-2.5 rounded-full uppercase tracking-[0.2em] border border-white/5`}>{currentQuestion.materia}</span>
              </div>

              <div className="space-y-12">
                <h3 className={`text-2xl md:text-3xl font-extrabold leading-relaxed tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
                  {currentQuestion.statement}
                </h3>

                <div className="grid grid-cols-1 gap-5">
                  {currentQuestion.options.map(opt => {
                    const isCorrect = opt.id === currentQuestion.correctAnswerId;
                    const isSelected = selectedOption === opt.id;
                    
                    let btnStyle = theme === 'dark' ? "border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700";
                    
                    if (showExplanation) {
                      if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]";
                      else if (isSelected) btnStyle = "border-rose-500 bg-rose-500/10 text-rose-400";
                      else btnStyle = "opacity-20 border-transparent bg-transparent blur-[1px]";
                    }

                    return (
                      <button 
                        key={opt.id}
                        onClick={() => handleAnswer(opt.id)}
                        disabled={showExplanation}
                        className={`w-full text-left p-8 rounded-[2rem] border transition-all duration-300 flex items-start gap-8 btn-click-effect relative group ${btnStyle}`}
                      >
                        <span className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-base font-black border transition-all duration-500 ${
                          isSelected ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : theme === 'dark' ? 'border-zinc-800 text-zinc-500' : 'border-slate-300 text-slate-400'
                        }`}>{opt.id}</span>
                        <span className="text-lg md:text-xl font-bold leading-relaxed pt-2 transition-transform duration-300 group-hover:translate-x-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showExplanation && (
                <div className={`mt-16 p-10 md:p-14 rounded-[3rem] border animate-in slide-in-from-top-8 duration-700 ${theme === 'dark' ? 'bg-zinc-950 border-white/5 shadow-inner' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex items-center gap-5 mb-8">
                     <div className="w-1.5 h-8 bg-blue-600 rounded-full glow-text"></div>
                     <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em]">ANÁLISE DO MENTOR</p>
                  </div>
                  <p className={`${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'} text-lg leading-relaxed font-medium italic opacity-90`}>{currentQuestion.explanation}</p>
                  <button onClick={handleNext} className={`mt-12 bg-zinc-100 text-zinc-950 hover:bg-white px-16 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all btn-click-effect shadow-2xl`}>
                    {answeredCount >= questionCount ? 'VER RESULTADOS FINAIS' : 'PRÓXIMA FASE'}
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      {isGameOver && (
        <div className={`p-20 rounded-[5rem] text-center border space-y-12 animate-in zoom-in duration-700 shadow-3xl ${theme === 'dark' ? 'glass-card border-blue-600/20 shadow-blue-900/20' : 'bg-white border-slate-200'}`}>
           <div className="text-9xl mb-8 filter drop-shadow-[0_0_30px_rgba(37,99,235,0.5)] animate-bounce">🏆</div>
           <div className="space-y-4">
              <h3 className={`text-6xl font-black uppercase tracking-tighter glow-text`}>MISSÃO CUMPRIDA</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.5em]">Relatório Final de Treinamento</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className={`p-10 rounded-[3rem] border ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                 <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">TOTAL PROCESSADO</p>
                 <p className={`text-6xl font-black italic`}>{answeredCount}</p>
              </div>
              <div className={`p-10 rounded-[3rem] border ${theme === 'dark' ? 'bg-emerald-600/5 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-emerald-50 border-emerald-200'}`}>
                 <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-3">ACERTOS TÉCNICOS</p>
                 <p className="text-6xl font-black text-emerald-500 italic">{correctCount}</p>
              </div>
           </div>
           
           <button onClick={() => setIsGameOver(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-20 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all btn-click-effect shadow-[0_20px_60px_rgba(37,99,235,0.5)]">
              REINICIAR OPERAÇÃO
           </button>
        </div>
      )}
    </div>
  );
};

export default Simulator;