
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";
import { trackApiUsage, supabase } from "./supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id;
};

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma questão de múltipla escolha inédita para concursos no Brasil. BANCA: "${banca}" MATÉRIA: "${materia}" NÍVEL: "${nivel}" 5 alternativas (A-E). Responda JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING } } } },
          correctAnswerId: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["statement", "options", "correctAnswerId", "explanation"]
      }
    }
  });

  if (userId) await trackApiUsage(userId, 'FLASH');
  const data = JSON.parse(response.text || "{}");
  return { ...data, id: `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, banca, materia, nivel };
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere 5 flashcards para "${materia}". JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["front", "back", "subject"] }
      }
    }
  });
  if (userId) await trackApiUsage(userId, 'FLASH');
  return JSON.parse(response.text || "[]");
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const userId = await getUserId();
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
  if (userId) await trackApiUsage(userId, 'PRO');
  return JSON.parse(response.text || "{}");
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Mapa mental: ${prompt}` }] }
  });
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  if (userId) await trackApiUsage(userId, 'IMAGE');
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

// ... Outras funções seguem o mesmo padrão de trackApiUsage ...
export const generateStudyPlan = async (materia: Materia, horasDisponiveis: number): Promise<StudyPlanDay[]> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Cronograma "${materia}" ${horasDisponiveis}h. JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { period: { type: Type.STRING }, activity: { type: Type.STRING }, focus: { type: Type.STRING } } } }
    }
  });
  if (userId) await trackApiUsage(userId, 'FLASH');
  return JSON.parse(response.text || "[]");
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Mnemônico "${materia}". JSON puro.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { phrase: { type: Type.STRING }, meaning: { type: Type.STRING }, explanation: { type: Type.STRING } } }
    }
  });
  if (userId) await trackApiUsage(userId, 'FLASH');
  return JSON.parse(response.text || "{}");
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Tema redação banca "${banca}". Retorne apenas título.`,
  });
  if (userId) await trackApiUsage(userId, 'PRO');
  return response.text || "Tema Indisponível";
};

export const getEssayTips = async (theme: string, banca: Banca) => {
  const userId = await getUserId();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `4 dicas tema: "${theme}". JSON ARRAY.`,
    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
  });
  if (userId) await trackApiUsage(userId, 'FLASH');
  return JSON.parse(response.text || "[]");
};
