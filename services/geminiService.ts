
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";

const getApiKey = () => {
  // Tenta pegar do process.env (Vite define) ou do objeto global window.process
  const key = process?.env?.API_KEY || (window as any).process?.env?.API_KEY;
  if (!key || key === 'undefined' || key === 'YOUR_API_KEY') return "";
  return key.trim();
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("CHAVE_FALTANDO");
  }
  return new GoogleGenAI({ apiKey });
};

// Função para tratar erros de API de forma centralizada
const handleApiError = (error: any) => {
  console.error("Erro na API Gemini:", error);
  if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("403") || error?.message?.includes("401")) {
    throw new Error("CHAVE_INVALIDA");
  }
  if (error?.message?.includes("CHAVE_FALTANDO")) {
    throw new Error("CHAVE_FALTANDO");
  }
  throw error;
};

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  try {
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 flashcards de revisão rápida para a matéria "${materia}" de concursos públicos brasileiros. Responda apenas JSON puro.`,
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateStudyPlan = async (materia: Materia, horasDisponiveis: number): Promise<StudyPlanDay[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie um cronograma de estudo para "${materia}" com ${horasDisponiveis} horas. JSON puro.`,
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere um tema de redação para a banca "${banca}". Retorne apenas o texto do tema.`,
    });
    return response.text || "Tema indisponível no momento.";
  } catch (e) {
    return handleApiError(e);
  }
};

export const getEssayTips = async (theme: string, banca: Banca) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dicas para o tema: "${theme}" (Banca ${banca}). JSON ARRAY de strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return handleApiError(e);
  }
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  try {
    const ai = getAI();
    const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: pureBase64, mimeType: 'image/jpeg' } },
          { text: `Avalie esta redação: Tema "${theme}", Banca "${banca}". JSON puro.` }
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  try {
    const ai = getAI();
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const getLatestNews = async (query: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Notícias: ${query}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    return handleApiError(e);
  }
};

export const editStudyImage = async (base64Image: string, prompt: string) => {
  try {
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
  } catch (e) {
    return handleApiError(e);
  }
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Mapa mental: ${prompt}` }]
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) {
    return handleApiError(e);
  }
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const ai = getAI();
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
  } catch (e) {
    return handleApiError(e);
  }
};
