
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface ProfessorProps { isFloat?: boolean; }

const Professor: React.FC<ProfessorProps> = ({ isFloat = false }) => {
  const [mode, setMode] = useState<'none' | 'audio' | 'text'>('none');
  const [messages, setMessages] = useState<{ role: 'user' | 'system'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, mode]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
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
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
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
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { 
          systemInstruction: 'Você é um Mentor Técnico para concursos. Forneça respostas curtas, diretas e objetivas. Use listas (bullets) para organizar conceitos. Evite formatações complexas de markdown, prefira texto limpo e parágrafos curtos.' 
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
    <div className={`flex flex-col h-full bg-zinc-950/50 ${isFloat ? 'w-full' : 'max-w-4xl mx-auto min-h-[70vh]'}`}>
      {mode === 'none' && (
        <div className={`flex flex-col items-center justify-center h-full p-10 space-y-10 ${isFloat ? 'py-20' : ''}`}>
          {!isFloat && (
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">CONSULTORIA <span className="text-blue-500">AI</span></h2>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.6em]">Mentor Técnico Privado</p>
            </div>
          )}
          <div className={`grid gap-6 w-full ${isFloat ? 'grid-cols-1' : 'sm:grid-cols-2 max-w-2xl'}`}>
            <button 
              onClick={startLiveSession}
              className="flex items-center gap-6 p-10 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all group btn-click-effect shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <span className="text-2xl text-blue-500">🎙️</span>
              </div>
              <div className="text-left">
                <p className="font-black text-[11px] text-white tracking-widest uppercase mb-1">Via Áudio</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">Sessão em Tempo Real</p>
              </div>
            </button>

            <button 
              onClick={() => setMode('text')}
              className="flex items-center gap-6 p-10 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all group btn-click-effect shadow-xl"
            >
              <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-zinc-800 shadow-xl">
                <span className="text-2xl text-zinc-500 group-hover:text-emerald-500 transition-colors">💬</span>
              </div>
              <div className="text-left">
                <p className="font-black text-[11px] text-white tracking-widest uppercase mb-1">Via Chat</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">Texto e Listas Técnicas</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'audio' && (
        <div className="flex flex-col items-center justify-center h-full p-10 space-y-10 animate-in zoom-in duration-500">
          <div className="flex gap-1.5 h-16 items-center">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite]" 
                style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.08}s` }}
              ></div>
            ))}
          </div>
          <div className="text-center space-y-2">
            <p className="text-[11px] font-black text-blue-500 tracking-[0.5em] uppercase animate-pulse">Mentor Ouvindo...</p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase">Pode falar sua dúvida técnica</p>
          </div>
          <button 
            onClick={stopLiveSession}
            className="px-10 py-4 bg-zinc-900 border border-red-500/50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all btn-click-effect shadow-xl"
          >
            ENCERRAR
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-700">
          <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-hide">
            {messages.length === 0 && (
               <div className="text-center py-10 opacity-30 italic text-sm text-zinc-500">
                  Como posso acelerar sua aprovação hoje?
               </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap shadow-2xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-zinc-950/90 border-t border-zinc-900 flex gap-3 backdrop-blur-md">
            <input 
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite aqui..."
              className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl outline-none text-xs text-zinc-100 focus:border-blue-600 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 shadow-lg shadow-blue-600/20"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
               </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Professor;
