import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

interface MindMapCreatorProps {
  theme: 'dark' | 'light';
}

const MindMapCreator: React.FC<MindMapCreatorProps> = ({ theme }) => {
  const [inputType, setInputType] = useState<'text' | 'voice' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMap, setGeneratedMap] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processInput('audio', base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Erro ao acessar microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processInput = async (type: 'text' | 'audio' | 'image', data?: string) => {
    setIsLoading(true);
    setGeneratedMap(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      setLoadingStep('Interpretando conteúdo...');
      let contentToMap = inputText;

      if (type === 'audio' && data) {
        const audioResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data, mimeType: 'audio/webm' } },
              { text: "Transcreva este áudio de estudo de forma precisa e direta." }
            ]
          }
        });
        contentToMap = audioResponse.text || '';
      } else if (type === 'image' && selectedImage) {
        const base64Image = selectedImage.split(',')[1];
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
              { text: "Extraia os pontos principais desta imagem de estudo para criar um mapa mental." }
            ]
          }
        });
        contentToMap = imageResponse.text || '';
      }

      setLoadingStep('Estruturando conexões neurais...');
      const blueprintResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma descrição visual detalhada para um mapa mental profissional baseado nisto: "${contentToMap}". Descreva o nó central, ramos primários e secundários, sugerindo cores e ícones para cada ramo.`
      });

      setLoadingStep('Renderizando Mapa Mental...');
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A high-quality, professional, and very readable educational mind map based on this structure: ${blueprintResponse.text}. Clean design, white background, distinct colors for each branch, clear text labels.` }]
        }
      });

      const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imagePart) {
        setGeneratedMap(`data:image/png;base64,${imagePart.inlineData.data}`);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar o mapa mental. Tente novamente.");
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 page-transition">
      <header className="border-l-4 border-purple-600 pl-6">
        <h2 className="text-4xl font-black uppercase tracking-tighter">MAPA <span className="text-purple-600">MENTAL AI</span></h2>
        <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'} font-bold text-xs uppercase tracking-widest mt-1`}>SÍNTESE VISUAL MULTIMODAL</p>
      </header>

      <div className={`glass-card p-10 rounded-[3.5rem] border space-y-10 ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-200'}`}>
        <div className="flex flex-wrap gap-4 justify-center">
          {(['text', 'voice', 'image'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setInputType(t)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                inputType === t 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {t === 'text' ? 'Texto' : t === 'voice' ? 'Voz' : 'Imagem'}
            </button>
          ))}
        </div>

        <div className="min-h-[200px] flex flex-col items-center justify-center">
          {inputType === 'text' && (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cole aqui seu resumo, lei ou tópicos para transformar em mapa..."
              className={`w-full h-48 p-8 rounded-3xl outline-none focus:border-purple-600 border transition-all resize-none text-sm font-medium ${
                theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          )}

          {inputType === 'voice' && (
            <div className="text-center space-y-6">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all ${isRecording ? 'bg-purple-600 animate-pulse scale-110 shadow-[0_0_40px_rgba(147,51,234,0.4)]' : 'bg-zinc-900 border border-white/5'}`}>
                <span className="text-5xl">{isRecording ? '🛑' : '🎙️'}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {isRecording ? 'Gravando Explicação...' : 'Clique para Iniciar Gravação'}
              </p>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest btn-click-effect shadow-xl shadow-purple-600/20"
              >
                {isRecording ? 'Finalizar' : 'Gravar Áudio'}
              </button>
            </div>
          )}

          {inputType === 'image' && (
            <div className="w-full space-y-6 flex flex-col items-center">
              <input type="file" id="map-img-upload" hidden onChange={handleImageUpload} accept="image/*" />
              <label 
                htmlFor="map-img-upload" 
                className={`w-full h-48 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-purple-600/50 ${
                  selectedImage ? 'border-purple-600 bg-purple-600/5' : theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="Preview" className="h-full object-contain rounded-3xl p-4" />
                ) : (
                  <>
                    <span className="text-4xl mb-4">📸</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Enviar Foto de Estudo</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {inputType !== 'voice' && (
          <button
            onClick={() => processInput(inputType)}
            disabled={isLoading || (inputType === 'text' && !inputText) || (inputType === 'image' && !selectedImage)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all btn-click-effect shadow-2xl shadow-purple-600/20 disabled:opacity-30"
          >
            {isLoading ? 'PROCESSANDO...' : 'SINTETIZAR MAPA MENTAL'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center py-20 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-purple-600/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-purple-600 text-[11px] font-black uppercase tracking-[0.5em] animate-pulse">{loadingStep}</p>
        </div>
      )}

      {generatedMap && (
        <div className={`p-8 md:p-12 rounded-[4rem] border animate-in zoom-in slide-in-from-bottom-12 duration-1000 ${theme === 'dark' ? 'bg-zinc-900 border-purple-500/10' : 'bg-white border-slate-200 shadow-3xl'}`}>
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              <h3 className="text-xl font-black uppercase tracking-tight">MAPA GERADO</h3>
            </div>
            <a 
              href={generatedMap} 
              download="mapa-mental-concursomaster.png"
              className="bg-zinc-950 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all border border-white/5 shadow-xl"
            >
              Download PNG
            </a>
          </div>
          <div className="relative group cursor-zoom-in overflow-hidden rounded-[2.5rem] border border-black/5">
            <img src={generatedMap} alt="Mapa Mental Gerado" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
          </div>
          <p className={`text-center mt-10 text-[10px] font-medium italic ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
            * O mapa foi gerado com inteligência artificial para otimizar sua retenção visual.
          </p>
        </div>
      )}
    </div>
  );
};

export default MindMapCreator;