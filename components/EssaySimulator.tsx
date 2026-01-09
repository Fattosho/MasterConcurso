import React, { useState, useEffect, useRef } from 'react';
import { Banca, EssayFeedback } from '../types';
import { generateEssayTheme, evaluateEssayImage, getEssayTips } from '../services/geminiService';

const EssaySimulator: React.FC<{ theme: 'dark' | 'light' }> = ({ theme: appTheme }) => {
  const [banca, setBanca] = useState<Banca>('FGV');
  const [examMinutes, setExamMinutes] = useState(60);
  const [theme, setTheme] = useState<string | null>(null);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);

  const [tips, setTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const [timerStatus, setTimerStatus] = useState<'idle' | 'reading' | 'writing' | 'expired'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  
  const timerRef = useRef<any>(null);
  const tipTimerRef = useRef<any>(null);

  const bancas: Banca[] = [
    'FGV', 'Cebraspe', 'FCC', 'Vunesp', 'Cesgranrio', 'Instituto AOCP', 
    'IBFC', 'Idecan', 'Instituto Quadrix', 'IADES', 'Selecon'
  ];

  const handleGenerateTheme = async () => {
    setLoadingTheme(true);
    setTheme(null);
    setFeedback(null);
    setTips([]);
    setTimerStatus('idle');
    if (timerRef.current) clearInterval(timerRef.current);
    if (tipTimerRef.current) clearInterval(tipTimerRef.current);

    try {
      const themeResult = await generateEssayTheme(banca);
      setTheme(themeResult);
      
      const tipsResult = await getEssayTips(themeResult, banca);
      setTips(tipsResult);
      setCurrentTipIndex(0);

      setTimerStatus('reading');
      setTimeLeft(60);
    } catch (e) {
      alert("FALHA AO PROJETAR TEMA.");
    } finally {
      setLoadingTheme(false);
    }
  };

  useEffect(() => {
    if (timerStatus === 'idle' || timerStatus === 'expired') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerStatus === 'reading') {
            setTimerStatus('writing');
            return examMinutes * 60;
          } else {
            setTimerStatus('expired');
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStatus, examMinutes]);

  useEffect(() => {
    if ((timerStatus === 'reading' || timerStatus === 'writing') && tips.length > 0 && !feedback) {
      tipTimerRef.current = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 300000);
    } else {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
    }
    return () => { if (tipTimerRef.current) clearInterval(tipTimerRef.current); };
  }, [timerStatus, tips, feedback]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedImage || !theme) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateEssayImage(selectedImage, theme, banca);
      setFeedback(result);
    } catch (e: any) {
      alert("ERRO NA ANÁLISE ÓPTICA.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const cardClasses = `glass-card p-10 rounded-[2.5rem] border space-y-8 ${appTheme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`;

  return (
    <div className="page-transition max-w-6xl mx-auto space-y-12 pb-20">
      <header className="border-l-4 border-blue-600 pl-6">
        <h2 className="text-4xl font-black uppercase tracking-tighter">CORRETOR DE <span className="text-blue-600">REDAÇÃO</span></h2>
        <p className={`${appTheme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-xs uppercase tracking-widest mt-1`}>ENVIE FOTO DA SUA REDAÇÃO PARA AVALIAÇÃO IA</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className={cardClasses}>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">CONFIGURAÇÃO</h3>
            
            <div className="space-y-4">
              <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest">BANCA ALVO</label>
              <select 
                value={banca} 
                onChange={(e) => setBanca(e.target.value as Banca)}
                className={`w-full p-4 rounded-2xl border focus:border-blue-500 outline-none text-[11px] font-black uppercase tracking-widest appearance-none ${appTheme === 'dark' ? 'bg-zinc-950 text-zinc-300 border-zinc-800' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
              >
                {bancas.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest">TEMPO (MINUTOS)</label>
              <input 
                type="number" 
                value={examMinutes} 
                onChange={(e) => setExamMinutes(Number(e.target.value))}
                className={`w-full p-4 rounded-2xl border focus:border-blue-500 outline-none text-[11px] font-black uppercase tracking-widest ${appTheme === 'dark' ? 'bg-zinc-950 text-zinc-300 border-zinc-800' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
              />
            </div>

            <button 
              onClick={handleGenerateTheme}
              disabled={loadingTheme}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] btn-click-effect shadow-xl shadow-blue-600/20"
            >
              {loadingTheme ? 'ELABORANDO...' : 'PROJETAR TEMA'}
            </button>
          </div>

          {loadingTheme ? (
            <div className={`p-10 rounded-[2.5rem] border flex flex-col items-center justify-center space-y-8 min-h-[250px] animate-in fade-in duration-300 ${appTheme === 'dark' ? 'bg-zinc-900/40 border-blue-500/20 shadow-blue-900/10' : 'bg-white border-blue-200 shadow-slate-200/50'}`}>
              <div className="text-7xl animate-pulse">✍️</div>
              <p className="text-blue-600 text-[10px] font-black tracking-[0.4em] uppercase">SINTETIZANDO PROPOSTA</p>
            </div>
          ) : theme ? (
            <div className={`p-10 rounded-[2.5rem] border space-y-8 animate-in slide-in-from-left-8 duration-500 shadow-xl ${appTheme === 'dark' ? 'bg-zinc-900/40 border-blue-500/10' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">TEMA GERADO</h3>
                <p className={`font-bold text-xl leading-relaxed mt-2 ${appTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>"{theme}"</p>
              </div>

              {tips.length > 0 && !feedback && (timerStatus === 'reading' || timerStatus === 'writing') && (
                <div className="bg-blue-600/5 border border-blue-600/20 rounded-3xl p-6 space-y-4">
                  <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">DICA DO PROFESSOR</h4>
                  <p className={`text-[13px] font-medium leading-relaxed text-center ${appTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>{tips[currentTipIndex]}</p>
                </div>
              )}
              
              <div className={`p-6 rounded-3xl border ${timerStatus === 'reading' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-blue-600/5 border-blue-600/30'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-zinc-500">{timerStatus === 'reading' ? 'LEITURA' : 'ESCRITA'}</p>
                <span className={`text-4xl font-mono font-black ${timerStatus === 'reading' ? 'text-amber-500' : appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatTime(timeLeft)}</span>
              </div>

              <div className="pt-4 space-y-4">
                {timerStatus !== 'expired' ? (
                  <>
                    <input type="file" id="essay-upload" hidden onChange={handleImageUpload} accept="image/*" />
                    <label 
                      htmlFor="essay-upload" 
                      className={`block w-full text-center border-2 border-dashed p-10 rounded-[2rem] cursor-pointer transition-all ${selectedImage ? 'border-blue-600/50 bg-blue-600/5' : 'border-zinc-800 bg-zinc-950'}`}
                    >
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{selectedImage ? 'IMAGEM CARREGADA' : 'ENVIE FOTO DA REDAÇÃO'}</span>
                    </label>
                    
                    {selectedImage && (
                      <button 
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all btn-click-effect shadow-xl shadow-blue-600/20"
                      >
                        {isEvaluating ? 'ANALISANDO...' : 'AVALIAR AGORA'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-10 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest">TEMPO ESGOTADO</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-8 space-y-8">
          {feedback && (
            <div className={`p-12 md:p-16 rounded-[3.5rem] border space-y-12 animate-in zoom-in duration-700 shadow-2xl ${appTheme === 'dark' ? 'bg-zinc-900/40 border-blue-500/10' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-10">
                <div>
                  <h3 className="text-7xl font-black text-blue-600 tracking-tighter">{feedback.grade}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-3">SCORE FINAL</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-blue-600/5 border border-blue-600/20 rounded-3xl">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 tracking-widest">PONTOS FORTES</h4>
                  <ul className="space-y-4">
                    {feedback.pros.map((p, i) => (
                      <li key={i} className={`text-[13px] flex items-start gap-4 ${appTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}><span className="text-blue-600 font-black">+</span> {p}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase mb-6 tracking-widest">A MELHORAR</h4>
                  <ul className="space-y-4">
                    {feedback.cons.map((c, i) => (
                      <li key={i} className={`text-[13px] flex items-start gap-4 ${appTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}><span className="text-rose-500 font-black">-</span> {c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={`p-10 rounded-[2.5rem] border ${appTheme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-base leading-relaxed italic ${appTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{feedback.fullAnalysis}</p>
              </div>

              <div className="bg-blue-600 border border-blue-500/30 p-8 rounded-3xl text-white">
                <h4 className="text-[10px] font-black uppercase mb-3 tracking-widest opacity-80">ESTRATÉGIA</h4>
                <p className="text-base font-black tracking-tight uppercase">{feedback.tips}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssaySimulator;