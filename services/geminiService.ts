import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";

// Função helper para obter a chave com segurança
const getApiKey = () => {
  const key = process?.env?.API_KEY;
  if (!key || key === 'undefined') return "";
  return key;
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY não encontrada nas variáveis de ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma questão de múltipla escolha inédita para concursos no Brasil.
    BANCA: "${banca}"
    MATÉRIA: "${materia}"
    NÍVEL: "${nivel}"
    Estilo: Fiel à banca. 5 alternativas (A-E). Responda apenas JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING }
              }
            }
          },
          correctAnswerId: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["statement", "options", "correctAnswerId", "explanation"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return {
    ...data,
    id: `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    banca,
    materia,
    nivel
  };
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 flashcards de revisão rápida para a matéria "${materia}" de concursos públicos brasileiros.
    Foque em prazos, conceitos chaves ou artigos importantes. 
    Responda apenas JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
            subject: { type: Type.STRING }
          },
          required: ["front", "back", "subject"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateStudyPlan = async (materia: Materia, horasDisponiveis: number): Promise<StudyPlanDay[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um cronograma de estudo intensivo para a matéria "${materia}" considerando ${horasDisponiveis} horas de estudo.
    Divida em 3 períodos (Início, Meio, Fim). Responda apenas JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            period: { type: Type.STRING },
            activity: { type: Type.STRING },
            focus: { type: Type.STRING }
          },
          required: ["period", "activity", "focus"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Gere um tema de redação inédito e atualizado, típico da banca "${banca}". Retorne apenas o título/frase temática.`,
  });
  return response.text || "Importância da ética no serviço público";
};

export const getEssayTips = async (theme: string, banca: Banca) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dê 4 dicas simples para o tema: "${theme}" na banca ${banca}. JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const ai = getAI();
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: pureBase64, mimeType } },
        { text: `Avalie esta redação para o tema "${theme}" (Banca ${banca}). JSON puro.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grade: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          tips: { type: Type.STRING },
          fullAnalysis: { type: Type.STRING }
        },
        required: ["grade", "pros", "cons", "tips", "fullAnalysis"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um mnemônico para a matéria "${materia}". JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaning: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["phrase", "meaning", "explanation"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const getLatestNews = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Notícias recentes sobre: ${query}. Use Markdown.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const editStudyImage = async (base64Image: string, prompt: string) => {
  const ai = getAI();
  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: pureBase64, mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Mapa mental profissional sobre: ${prompt}.` }]
    }
  });
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
        { text: "Transcreva e resuma este áudio de estudo." }
      ]
    }
  });
  return response.text || "";
};