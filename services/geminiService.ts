import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";

// O SDK do Gemini espera o process.env.API_KEY injetado pelo Vite
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 flashcards de revisão para "${materia}". Responda apenas JSON puro.`,
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um cronograma de estudo para "${materia}" com ${horasDisponiveis}h. JSON puro.`,
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Tema de redação para banca "${banca}". Retorne apenas o título.`,
  });
  return response.text || "Tema Indisponível";
};

export const getEssayTips = async (theme: string, banca: Banca) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `4 dicas para o tema: "${theme}". JSON ARRAY.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: pureBase64, mimeType: 'image/jpeg' } },
        { text: `Avalie esta redação: Tema "${theme}". JSON puro.` }
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Mnemônico para "${materia}". JSON puro.`,
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Notícias: ${query}`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const editStudyImage = async (base64Image: string, prompt: string) => {
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
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Mapa mental: ${prompt}` }]
    }
  });
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
        { text: "Transcreva e resuma." }
      ]
    }
  });
  return response.text || "";
};