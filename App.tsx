
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import Flashcards from './components/Flashcards';
import StudyPlan from './components/StudyPlan';
import { UserPerformance } from './types';
import { getLatestNews, editStudyImage, generateMindMapFromDescription, transcribeAndSummarizeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [performance, setPerformance] = useState<UserPerformance>(() => {
    try {
      const saved = localStorage.getItem('user_performance');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          totalAnswered: parsed.totalAnswered || 0,
          correctAnswers: parsed.correctAnswers || 0,
          subjectStats: parsed.subjectStats || {},
          xp: parsed.xp || 0,
          level: parsed.level || 1
        };
      }
    } catch (e) { console.error(e); }
    return { totalAnswered: 0, correctAnswers: 0, subjectStats: {}, xp: 0, level: 1 };
  });

  const [newsQuery, setNewsQuery] = useState('Concursos abertos Brasil 2025');
  const [newsResult, setNewsResult] = useState<{text: string, sources: any[]} | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  const [mindMapMode, setMindMapMode] = useState<'enhance' | 'text' | 'voice' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isProcessingMindMap, setIsProcessingMindMap] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('user_performance', JSON.stringify(performance));
  }, [performance]);

  const handleQuestionAnswered = (isCorrect: boolean, subject: string) => {
    setPerformance(prev => {
      const stats = { ...(prev.subjectStats || {}) };
      const current = stats[subject] || { total: 0, correct: 0 };
      const newXp = (prev.xp || 0) + (isCorrect ? 25 : 5);
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      return {
        ...prev,
        totalAnswered: (prev.totalAnswered || 0) + 1,
        correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
        xp: newXp,
        level: newLevel,
        subjectStats: {
          ...stats,
          [subject]: {
            total: current.total + 1,
            correct: current.correct + (isCorrect ? 1 : 0)
          }
        }
      };
    });
  };

  const handleSearchNews = async () => {
    setNewsLoading(true);
    try {
      const result = await getLatestNews(newsQuery);
      setNewsResult(result);
    } catch (err) { alert("Falha na busca."); }
    finally { setNewsLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMindMapAction = async () => {
    if (!mindMapMode) return;
    setIsProcessingMindMap(true);
    try {
      if (mindMapMode === 'enhance') {
        if (!selectedImage) return;
        const result = await editStudyImage(selectedImage, imagePrompt || "Melhore legibilidade");
        if (result) setSelectedImage(result);
      } else if (mindMapMode === 'text') {
        const result = await generateMindMapFromDescription(imagePrompt);
        if (result) setSelectedImage(result);
      }
    } catch (err) { alert("Erro ao processar."); }
    finally { setIsProcessingMindMap(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessingMindMap(true);
          try {
            const summary = await transcribeAndSummarizeAudio(base64Audio);
            const mindMapResult = await generateMindMapFromDescription(summary);
            if (mindMapResult) setSelectedImage(mindMapResult);
          } catch (e) { alert("Erro no áudio."); }
          finally { setIsProcessingMindMap(false); }
        };
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) { alert("Microfone não disponível."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-100 selection:bg-blue-500/30 overflow-hidden relative">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:3s]"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full relative z-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard performance={performance} setActiveTab={setActiveTab} />}
          {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} />}
          {activeTab === 'flashcards' && <Flashcards />}
          {activeTab === 'study-plan' && <StudyPlan />}
          {activeTab === 'essay' && <EssaySimulator />}
          {activeTab === 'mnemonics' && <MnemonicGenerator />}
          
          {activeTab === 'news' && (
            <div className="page-transition space-y-10">
              <header className="border-l-4 border-blue-400 pl-8">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">RADAR DE <span className="text-blue-400">EDITAIS</span></h2>
                <p className="text-zinc-500 font-bold text-xs mt-2 uppercase tracking-widest">Sincronização global de editais abertos e previstos.</p>
              </header>
              <div className="flex flex-col sm:flex-row gap-5 bg-zinc-900/40 p-4 rounded-[3rem] border border-white/5 backdrop-blur-2xl shadow-2xl">
                <input 
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  className="flex-1 bg-transparent px-8 py-5 rounded-2xl outline-none font-bold text-sm text-white"
                  placeholder="Ex: Concurso Receita Federal 2025..."
                />
                <button 
                  onClick={handleSearchNews} 
                  disabled={newsLoading}
                  className="bg-blue-600 text-white px-14 py-5 rounded-[2rem] font-black text-xs uppercase hover:bg-blue-500 transition-all btn-click-effect shadow-xl shadow-blue-600/20"
                >
                  {newsLoading ? 'VARRENDO REDE...' : 'PESQUISAR AGORA'}
                </button>
              </div>

              {newsLoading ? (
                <div className="flex flex-col items-center py-32 space-y-12 animate-in fade-in duration-700">
                   <div className="relative w-40 h-40">
                      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-[15%] border-b-4 border-blue-400/30 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-5xl animate-float">🛰️</span>
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[12px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Interceptando Servidores</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-2">Filtrando editais via Google Search Grounding...</p>
                   </div>
                </div>
              ) : newsResult && (
                <div className="glass-card p-10 md:p-16 rounded-[4rem] border-blue-500/10 shadow-3xl backdrop-blur-xl animate-in fade-in zoom-in duration-700">
                  <div className="prose prose-invert prose-blue max-w-none text-zinc-300 leading-relaxed text-base font-sans">
                    {newsResult.text}
                  </div>
                  <div className="mt-12 flex flex-wrap gap-4 pt-10 border-t border-zinc-900">
                    {newsResult.sources.map((src, i) => (
                      <a key={i} href={src.web?.uri || '#'} target="_blank" className="text-[10px] font-black bg-zinc-900 border border-white/5 px-6 py-3 rounded-2xl text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition-all uppercase tracking-widest">
                        {src.web?.title || 'Relatório Oficial'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image-tools' && (
            <div className="page-transition space-y-12">
              <header className="border-l-4 border-blue-400 pl-8">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">NÚCLEO <span className="text-blue-400">VISUAL</span></h2>
                <p className="text-zinc-500 font-bold text-xs mt-2 uppercase tracking-widest">Conversão de ideias em arquiteturas de conhecimento.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { id: 'enhance', label: 'OTIMIZAR FOTO', icon: '📸' },
                  { id: 'text', label: 'CRIAR POR TEXTO', icon: '✍️' },
                  { id: 'voice', label: 'CRIAR POR VOZ', icon: '🎙️' }
                ].map((m) => (
                   <button 
                     key={m.id}
                     onClick={() => { setMindMapMode(m.id as any); setSelectedImage(null); }} 
                     className={`group p-10 rounded-[3rem] border transition-all flex flex-col items-center gap-6 btn-click-effect shadow-xl ${mindMapMode === m.id ? 'bg-blue-600 border-blue-400 scale-[1.05] z-10' : 'bg-zinc-900/50 border-white/5 backdrop-blur-xl hover:border-blue-400/30'}`}
                   >
                     <div className="text-6xl transition-transform group-hover:scale-125 duration-700">
                        {m.icon}
                     </div>
                     <span className={`text-[12px] font-black uppercase tracking-[0.3em] ${mindMapMode === m.id ? 'text-white' : 'text-zinc-500'}`}>
                        {m.label}
                     </span>
                   </button>
                ))}
              </div>

              {mindMapMode && (
                <div className="max-w-4xl mx-auto glass-card p-12 rounded-[4rem] border-white/5 space-y-10 animate-in slide-in-from-top-12 duration-700 shadow-3xl">
                  {isProcessingMindMap ? (
                    <div className="flex flex-col items-center py-20 space-y-10">
                       <div className="relative w-32 h-32">
                          <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-cyber-pulse"></div>
                          <div className="absolute inset-0 border-2 border-blue-500/30 rounded-3xl animate-float"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-4 h-16 bg-blue-500/40 animate-scan"></div>
                          </div>
                          <span className="absolute inset-0 flex items-center justify-center text-4xl">💎</span>
                       </div>
                       <div className="text-center">
                          <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] animate-pulse">RENDERIZAÇÃO COGNITIVA</p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-2">Extraindo eixos lógicos via Gemini 2.5 Flash...</p>
                       </div>
                    </div>
                  ) : (
                    <>
                      {mindMapMode === 'enhance' && (
                        <div className="space-y-8">
                          <input type="file" id="map-upload" hidden onChange={handleImageUpload} />
                          <label htmlFor="map-upload" className="block w-full text-center border-4 border-dashed border-zinc-900 p-24 rounded-[3.5rem] cursor-pointer hover:border-blue-400 transition-all bg-zinc-950 group relative overflow-hidden">
                             <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             {selectedImage ? <img src={selectedImage} className="h-40 mx-auto rounded-[2rem] shadow-3xl" /> : (
                               <div className="space-y-6 relative z-10">
                                 <div className="text-7xl opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">📥</div>
                                 <span className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.5em] block">SOLTAR ARQUIVO</span>
                               </div>
                             )}
                          </label>
                          <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Comandos de ajuste (Ex: 'Destaque prazos em vermelho', 'Foque no centro')..." className="w-full bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 focus:border-blue-400 outline-none text-sm h-32 resize-none transition-all font-medium" />
                          <button onClick={handleMindMapAction} disabled={!selectedImage || isProcessingMindMap} className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black text-xs uppercase shadow-2xl btn-click-effect hover:bg-blue-500 transition-all disabled:opacity-30">
                            INICIAR PROCESSAMENTO
                          </button>
                        </div>
                      )}

                      {mindMapMode === 'text' && (
                        <div className="space-y-8">
                          <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Descreva o fluxo lógico ou cole o resumo da matéria..." className="w-full bg-zinc-900/50 p-10 rounded-[3rem] border border-zinc-800 focus:border-blue-400 outline-none text-base h-72 transition-all font-medium" />
                          <button onClick={handleMindMapAction} disabled={!imagePrompt || isProcessingMindMap} className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black text-xs uppercase shadow-2xl btn-click-effect hover:bg-blue-500 transition-all">
                            GERAR MAPA DE ALTA DEFINIÇÃO
                          </button>
                        </div>
                      )}

                      {mindMapMode === 'voice' && (
                        <div className="flex flex-col items-center justify-center py-20 gap-16">
                          <div className="relative">
                            {isRecording && <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-[ping_2s_infinite]"></div>}
                            <button onClick={isRecording ? stopRecording : startRecording} className={`w-48 h-48 rounded-[3.5rem] flex items-center justify-center transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 ${isRecording ? 'bg-rose-600' : 'bg-blue-600 hover:bg-blue-500 hover:rotate-12 hover:scale-110'}`}>
                              {isRecording ? <div className="w-16 h-16 bg-white rounded-2xl animate-pulse"></div> : <span className="text-7xl">🎙️</span>}
                            </button>
                          </div>
                          <div className="text-center space-y-4">
                            <p className="text-[12px] font-black uppercase text-zinc-500 tracking-[0.6em]">{isRecording ? 'ANÁLISE ACÚSTICA ATIVA' : 'SISTEMA DE ESCUTA PRONTO'}</p>
                            <p className="text-sm text-zinc-400 font-bold uppercase">{isRecording ? 'Transcrevendo em tempo real...' : 'Toque no sensor para começar'}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedImage && !isProcessingMindMap && (
                <div className="animate-in zoom-in duration-1000 glass-card rounded-[4rem] border-blue-500/10 p-16 flex flex-col items-center gap-12 shadow-3xl">
                  <div className="relative group overflow-hidden rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                    <img src={selectedImage} className="max-w-full max-h-[800px] transition-transform duration-1000 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <a href={selectedImage} download="mapa-concurso-master.png" className="bg-blue-600 text-white px-20 py-7 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all btn-click-effect shadow-2xl shadow-blue-600/30 flex items-center gap-4">
                    <span>BAIXAR ARQUIVO DE ELITE</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
