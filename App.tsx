
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import EssaySimulator from './components/EssaySimulator';
import MnemonicGenerator from './components/MnemonicGenerator';
import Flashcards from './components/Flashcards';
import StudyPlan from './components/StudyPlan';
import Professor from './components/Professor';
import { UserPerformance } from './types';
import { getLatestNews, editStudyImage, generateMindMapFromDescription, transcribeAndSummarizeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
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

  useEffect(() => {
    // Verifica a chave de forma segura
    const key = process?.env?.API_KEY;
    if (!key || key === 'undefined' || key === '') {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }
  }, []);

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
    if (apiKeyMissing) { alert("Aguardando ativação da API_KEY..."); return; }
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
    if (!mindMapMode || apiKeyMissing) return;
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
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-100 selection:bg-blue-500/30 overflow-hidden relative">
      {apiKeyMissing && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase py-2 px-4 z-[100] flex justify-center items-center gap-4 animate-in slide-in-from-top duration-500">
           <span>ℹ️ SISTEMA INICIALIZADO. SE A IA NÃO RESPONDER, RE-FAÇA O DEPLOY NO NETLIFY COM A CHAVE SALVA.</span>
        </div>
      )}

      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full relative z-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard performance={performance} setActiveTab={setActiveTab} />}
          {activeTab === 'simulator' && <Simulator onQuestionAnswered={handleQuestionAnswered} />}
          {activeTab === 'flashcards' && <Flashcards />}
          {activeTab === 'study-plan' && <StudyPlan />}
          {activeTab === 'essay' && <EssaySimulator />}
          {activeTab === 'mnemonics' && <MnemonicGenerator />}
          {activeTab === 'mentoria' && <Professor />}
          
          {activeTab === 'news' && (
            <div className="page-transition space-y-10">
              <header className="border-l-4 border-blue-400 pl-8">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">RADAR DE <span className="text-blue-400">EDITAIS</span></h2>
              </header>
              <div className="flex flex-col sm:flex-row gap-5 bg-zinc-900/40 p-4 rounded-[3rem] border border-white/5 backdrop-blur-2xl">
                <input 
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  className="flex-1 bg-transparent px-8 py-5 rounded-2xl outline-none font-bold text-sm text-white"
                  placeholder="Ex: Concurso Receita Federal 2025..."
                />
                <button 
                  onClick={handleSearchNews} 
                  disabled={newsLoading}
                  className="bg-blue-600 text-white px-14 py-5 rounded-[2rem] font-black text-xs uppercase hover:bg-blue-500 shadow-xl"
                >
                  {newsLoading ? 'VARRENDO...' : 'PESQUISAR'}
                </button>
              </div>

              {newsResult && (
                <div className="glass-card p-10 md:p-16 rounded-[4rem] border-blue-500/10 shadow-3xl animate-in fade-in duration-700">
                  <div className="prose prose-invert max-w-none text-zinc-300">
                    {newsResult.text}
                  </div>
                  {newsResult.sources.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-zinc-900">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Fontes:</p>
                      <div className="flex flex-wrap gap-3">
                        {newsResult.sources.map((source: any, idx: number) => source.web && (
                          <a 
                            key={idx} 
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-blue-400 hover:border-blue-500 transition-all"
                          >
                            {source.web.title || source.web.uri}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'image-tools' && (
            <div className="page-transition space-y-12">
              <header className="border-l-4 border-blue-400 pl-8">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">NÚCLEO <span className="text-blue-400">VISUAL</span></h2>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <button onClick={() => setMindMapMode('enhance')} className={`p-10 rounded-[3rem] border transition-all flex flex-col items-center gap-6 ${mindMapMode === 'enhance' ? 'bg-blue-600' : 'bg-zinc-900/50'}`}>
                   <span className="text-4xl">📸</span>
                   <span className="text-[10px] font-black">OTIMIZAR FOTO</span>
                </button>
                <button onClick={() => setMindMapMode('text')} className={`p-10 rounded-[3rem] border transition-all flex flex-col items-center gap-6 ${mindMapMode === 'text' ? 'bg-blue-600' : 'bg-zinc-900/50'}`}>
                   <span className="text-4xl">✍️</span>
                   <span className="text-[10px] font-black">CRIAR POR TEXTO</span>
                </button>
                <button onClick={() => setMindMapMode('voice')} className={`p-10 rounded-[3rem] border transition-all flex flex-col items-center gap-6 ${mindMapMode === 'voice' ? 'bg-blue-600' : 'bg-zinc-900/50'}`}>
                   <span className="text-4xl">🎙️</span>
                   <span className="text-[10px] font-black">CRIAR POR VOZ</span>
                </button>
              </div>

              {mindMapMode && (
                <div className="max-w-4xl mx-auto glass-card p-12 rounded-[4rem] border-white/5 space-y-10 animate-in slide-in-from-top-12 duration-700">
                  {isProcessingMindMap ? (
                    <div className="flex flex-col items-center py-20 text-center">
                       <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin mb-4"></div>
                       <p className="text-[10px] font-black text-blue-400">PROCESSANDO REDE NEURAL...</p>
                    </div>
                  ) : (
                    <>
                      {mindMapMode === 'enhance' && (
                        <div className="space-y-8">
                          <input type="file" id="map-upload" hidden onChange={handleImageUpload} />
                          <label htmlFor="map-upload" className="block w-full text-center border-4 border-dashed border-zinc-900 p-24 rounded-[3.5rem] cursor-pointer hover:border-blue-400">
                             {selectedImage ? <img src={selectedImage} className="h-40 mx-auto rounded-2xl" /> : "📥 SOLTAR ARQUIVO"}
                          </label>
                          <button onClick={handleMindMapAction} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase">INICIAR</button>
                        </div>
                      )}
                      {mindMapMode === 'text' && (
                        <div className="space-y-8">
                          <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Descreva o conteúdo..." className="w-full bg-zinc-900/50 p-10 rounded-[3rem] outline-none text-base h-40" />
                          <button onClick={handleMindMapAction} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase">GERAR MAPA</button>
                        </div>
                      )}
                      {mindMapMode === 'voice' && (
                        <div className="flex flex-col items-center justify-center py-20 gap-16">
                           <button onClick={isRecording ? stopRecording : startRecording} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'}`}>
                              {isRecording ? "⏹️" : "🎙️"}
                           </button>
                           <p className="text-[10px] font-black uppercase text-zinc-500">{isRecording ? 'ESCUTANDO...' : 'TOQUE PARA FALAR'}</p>
                        </div>
                      )}
                    </>
                  )}
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
