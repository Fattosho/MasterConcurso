import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface ProfessorProps { isFloat?: boolean; theme: 'dark' | 'light'; }

const Professor: React.FC<ProfessorProps> = ({ isFloat = false, theme }) => {
  const [mode, setMode] = useState<'none' | 'audio' | 'text'>('none');
  const [messages, setMessages] = useState<{ role: 'user' | 'system'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, mode]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startLiveSession = async () => {
    setMode('audio');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setMode('none'),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'Você é um Mentor Técnico para concursos. Suas respostas devem ser curtas, diretas e estritamente profissionais. Evite saudações longas.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert("Erro ao acessar microfone.");
      setMode('none');
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setMode('none');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { 
          systemInstruction: 'Você é um Mentor Técnico para concursos. Forneça respostas curtas, diretas e objetivas. Use listas (bullets) para organizar conceitos.' 
        }
      });
      setMessages(prev => [...prev, { role: 'system', text: response.text || '' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', text: 'Erro de conexão com o sistema.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFloat ? 'w-full' : 'max-w-5xl mx-auto min-h-[75vh]'}`}>
      {mode === 'none' && (
        <div className={`flex flex-col items-center justify-center h-full p-6 space-y-12`}>
          <div className="text-center space-y-3">
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">CONSULTORIA <span className="text-blue-600">AI</span></h2>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Mentor Técnico Especialista</p>
          </div>
          <div className={`grid gap-8 w-full max-w-3xl ${isFloat ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            <button 
              onClick={startLiveSession}
              className={`flex flex-col items-center gap-6 p-12 border rounded-[3rem] transition-all group btn-click-effect shadow-xl ${
                theme === 'dark' ? 'bg-zinc-900/40 border-white/5 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                <span className="text-4xl">🎙️</span>
              </div>
              <div className="text-center">
                <p className="font-black text-xs text-white uppercase tracking-widest bg-blue-600 px-4 py-1 rounded-full mb-2">Via Áudio</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tempo Real</p>
              </div>
            </button>

            <button 
              onClick={() => setMode('text')}
              className={`flex flex-col items-center gap-6 p-12 border rounded-[3rem] transition-all group btn-click-effect shadow-xl ${
                theme === 'dark' ? 'bg-zinc-900/40 border-white/5 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                <span className="text-4xl">💬</span>
              </div>
              <div className="text-center">
                <p className="font-black text-xs text-white uppercase tracking-widest bg-blue-600 px-4 py-1 rounded-full mb-2">Via Chat</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Texto e Listas</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'audio' && (
        <div className={`glass-card flex flex-col items-center justify-center p-12 rounded-[3.5rem] border space-y-12 animate-in zoom-in duration-500 ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`}>
          <div className="flex gap-2 h-24 items-center">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-2 bg-blue-600 rounded-full animate-pulse" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
          <button 
            onClick={stopLiveSession}
            className="px-12 py-5 bg-blue-900 hover:bg-blue-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all btn-click-effect shadow-2xl"
          >
            ENCERRAR CONEXÃO
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className={`flex flex-col h-full rounded-[3.5rem] border overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-3xl ${
          theme === 'dark' ? 'bg-zinc-950/80 border-white/5 backdrop-blur-2xl' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">💬</div>
               <p className="text-[10px] font-black uppercase tracking-widest">Chat do Mentor</p>
             </div>
             <button onClick={() => setMode('none')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600/10 px-4 py-2 rounded-xl transition-all">Fechar</button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[14px] leading-relaxed whitespace-pre-wrap shadow-xl ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-blue-600/10' 
                    : theme === 'dark' ? 'bg-zinc-900 text-zinc-300 border border-white/5' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 border-t flex gap-4 ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua dúvida aqui..."
              className={`flex-1 p-5 rounded-2xl outline-none text-sm transition-all shadow-inner ${
                theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-zinc-100 focus:border-blue-600' : 'bg-white border border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-20 shadow-lg shadow-blue-600/30 btn-click-effect"
            >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Professor;