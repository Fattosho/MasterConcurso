
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import Professor from './components/Professor';
import { UserPerformance } from './types';
import { getLatestNews, editStudyImage, generateMindMapFromDescription, transcribeAndSummarizeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfessorOpen, setIsProfessorOpen] = useState(false);
  const [performance, setPerformance] = useState<UserPerformance>(() => {
    try {
      const saved = localStorage.getItem('user_performance');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          totalAnswered: parsed.totalAnswered || 0,
          correctAnswers: parsed.correctAnswers || 0,
          subjectStats: parsed.subjectStats || {}
        };
      }
    } catch (e) {
      console.error("Performance restore failed", e);
    }
    return {
      totalAnswered: 0,
      correctAnswers: 0,
      subjectStats: {}
    };
  });

  // News States
  const [newsQuery, setNewsQuery] = useState('Editais de Concursos 2024 2025');
  const [newsResult, setNewsResult] = useState<{text: string, sources: any[]} | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // Mind Map States
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
      
      return {
        ...prev,
        totalAnswered: (prev.totalAnswered || 0) + 1,
        correctAnswers: (prev.correctAnswers || 0) + (isCorrect ? 1 : 0),
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
    setNewsResult(null);
    try {
      const result = await getLatestNews(newsQuery);
      setNewsResult(result);
    } catch (err) {
      alert("Falha na busca de editais.");
    } finally {
      setNewsLoading(false);
    }
  };

  // Image Logic
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
        const result = await editStudyImage(selectedImage, imagePrompt || "Melhore a clareza e cores");
        if (result) setSelectedImage(result);
      } else if (mindMapMode === 'text') {
        const result = await generateMindMapFromDescription(imagePrompt);
        if (result) setSelectedImage(result);
      }
    } catch (err) {
      alert("Erro ao processar mapa mental.");
    } finally {
      setIsProcessingMindMap(false);
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

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
          } catch (e) {
            alert("Erro ao processar áudio.");
          } finally {
            setIsProcessingMindMap(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microfone não disponível.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-delay:2s]"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard performance={performance} />}
          {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} />}
          {activeTab === 'essay' && <EssaySimulator />}
          {activeTab === 'mnemonics' && <MnemonicGenerator />}
          
          {activeTab === 'news' && (
            <div className="page-transition space-y-6 md:space-y-8">
              <header className="border-l-4 border-blue-600 pl-6">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">CENTRAL DE <span className="text-blue-500">EDITAIS</span></h2>
                <p className="text-zinc-500 font-medium text-sm mt-1">Busca e filtragem avançada em tempo real.</p>
              </header>
              <div className="flex flex-col sm:flex-row gap-4 bg-zinc-900/40 p-3 rounded-[2rem] border border-zinc-800/50 backdrop-blur-md">
                <input 
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  className="flex-1 bg-transparent p-4 md:px-6 md:py-4 rounded-2xl outline-none font-bold text-sm"
                  placeholder="Buscando editais..."
                />
                <button 
                  onClick={handleSearchNews} 
                  disabled={newsLoading}
                  className="bg-blue-600 text-white px-10 py-4 sm:py-0 rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-blue-700 transition-all btn-click-effect shadow-lg shadow-blue-900/20"
                >
                  {newsLoading ? 'Sintonizando...' : 'Varrer Rede'}
                </button>
              </div>

              {newsLoading && (
                <div className="grid grid-cols-1 gap-6">
                   {[1, 2].map(i => (
                     <div key={i} className="glass-card p-10 rounded-[2.5rem] border-zinc-800/50 animate-pulse">
                        <div className="h-6 w-1/3 bg-zinc-800 rounded-lg mb-4"></div>
                        <div className="h-4 w-full bg-zinc-900 rounded-lg mb-2"></div>
                        <div className="h-4 w-full bg-zinc-900 rounded-lg mb-2"></div>
                        <div className="h-4 w-2/3 bg-zinc-900 rounded-lg"></div>
                     </div>
                   ))}
                </div>
              )}

              {newsResult && (
                <div className="glass-card p-6 md:p-12 rounded-[2.5rem] border-blue-500/10 shadow-2xl backdrop-blur-sm">
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none text-zinc-400 whitespace-pre-wrap font-sans">
                    {newsResult.text}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-zinc-800">
                    {newsResult.sources.map((src, i) => (
                      <a key={i} href={src.web?.uri || '#'} target="_blank" className="text-[9px] bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-blue-500 transition-colors">
                        {src.web?.title || 'Fonte externa'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image-tools' && (
            <div className="page-transition space-y-12">
              <header className="border-l-4 border-blue-600 pl-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">MAPAS <span className="text-blue-500">MENTAIS</span></h2>
                <p className="text-zinc-500 font-medium text-sm mt-1">Selecione a forma que iremos receber sua ideia de mapa mental</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {['enhance', 'text', 'voice'].map((m) => (
                   <button 
                     key={m}
                     onClick={() => { setMindMapMode(m as any); setSelectedImage(null); }} 
                     className={`group p-8 rounded-[2.5rem] border transition-all flex flex-col items-center gap-5 btn-click-effect ${mindMapMode === m ? 'bg-blue-600 border-blue-500 shadow-2xl scale-[1.02]' : 'bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md'}`}
                   >
                     <div className="text-4xl transition-transform group-hover:scale-110 duration-500">
                        {m === 'enhance' ? '📸' : m === 'text' ? '✍️' : '🎙️'}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${mindMapMode === m ? 'text-white' : 'text-zinc-500'}`}>
                        {m === 'enhance' ? 'Foto' : m === 'text' ? 'Texto' : 'Voz'}
                     </span>
                   </button>
                ))}
              </div>

              {mindMapMode && (
                <div className="max-w-4xl mx-auto glass-card p-10 rounded-[3rem] border-zinc-800/50 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  {mindMapMode === 'enhance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                      <div className="space-y-6">
                        <input type="file" id="map-upload" hidden onChange={handleImageUpload} />
                        <label htmlFor="map-upload" className="block w-full text-center border-2 border-dashed border-zinc-800 p-16 rounded-[2rem] cursor-pointer hover:border-blue-500/50 transition-all bg-zinc-950/50 group">
                           {selectedImage ? <img src={selectedImage} className="h-24 mx-auto rounded-xl shadow-2xl" /> : (
                             <div className="space-y-3">
                               <div className="text-3xl opacity-40 group-hover:opacity-100 transition-opacity">📤</div>
                               <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block">Upload Esquema</span>
                             </div>
                           )}
                        </label>
                        <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="O que deseja ajustar neste mapa?" className="w-full bg-zinc-950 p-6 rounded-2xl border border-zinc-800 focus:border-blue-500 outline-none text-xs h-28 resize-none transition-all" />
                      </div>
                      <button onClick={handleMindMapAction} disabled={!selectedImage || isProcessingMindMap} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase hover:bg-blue-700 disabled:opacity-20 btn-click-effect shadow-2xl mt-auto">
                        {isProcessingMindMap ? 'Ajustando Frequências...' : 'Processar Agora'}
                      </button>
                    </div>
                  )}

                  {mindMapMode === 'text' && (
                    <div className="space-y-6">
                      <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Descreva o conteúdo ou cole o texto aqui..." className="w-full bg-zinc-950 p-8 rounded-[2rem] border border-zinc-800 focus:border-blue-500 outline-none text-sm h-56 transition-all" />
                      <button onClick={handleMindMapAction} disabled={!imagePrompt || isProcessingMindMap} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase shadow-2xl btn-click-effect">
                        {isProcessingMindMap ? 'Sintetizando Conhecimento...' : 'Gerar Mapa Visual'}
                      </button>
                    </div>
                  )}

                  {mindMapMode === 'voice' && (
                    <div className="flex flex-col items-center justify-center py-16 gap-12">
                      <div className="relative">
                        {isRecording && <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping"></div>}
                        <button onClick={isRecording ? stopRecording : startRecording} className={`w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10 ${isRecording ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}>
                          {isRecording ? <div className="w-12 h-12 bg-white rounded-lg"></div> : <span className="text-5xl text-white">🎙️</span>}
                        </button>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em]">{isRecording ? 'MODULAÇÃO ATIVA' : 'SISTEMA DE ESCUTA PRONTO'}</p>
                        <p className="text-xs text-zinc-600 font-bold uppercase">{isRecording ? 'Gravando áudio...' : 'Toque para explicar sua ideia'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedImage && !isProcessingMindMap && (
                <div className="animate-in zoom-in duration-700 glass-card rounded-[3.5rem] border-blue-500/10 p-12 flex flex-col items-center gap-10 shadow-2xl">
                  <div className="relative group">
                    <img src={selectedImage} className="max-w-full max-h-[700px] rounded-[2.5rem] shadow-2xl transition-transform group-hover:scale-[1.01]" />
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  <a href={selectedImage} download="mapa-concurso-master.png" className="bg-zinc-900 border border-zinc-800 px-14 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-blue-500/50 transition-all btn-click-effect">
                    Baixar Mapa de Alta Performance
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Global AI Assistant (Professor) - Float UI */}
      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isProfessorOpen ? 'w-[400px] h-[600px] right-8 bottom-8' : 'w-16 h-16'}`}>
        {!isProfessorOpen ? (
          <button 
            onClick={() => setIsProfessorOpen(true)}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-110 transition-transform btn-click-effect animate-bounce [animation-duration:3s]"
          >
            <span className="text-2xl">🧠</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
          </button>
        ) : (
          <div className="w-full h-full glass-card rounded-[2.5rem] border-blue-500/20 shadow-2xl overflow-hidden flex flex-col">
             <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <span className="text-sm">🧠</span>
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">MENTOR MASTER</h4>
                      <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Online Agora</p>
                   </div>
                </div>
                <button onClick={() => setIsProfessorOpen(false)} className="text-zinc-500 hover:text-white p-2">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                   </svg>
                </button>
             </div>
             <div className="flex-1 overflow-hidden">
                <Professor isFloat={true} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
