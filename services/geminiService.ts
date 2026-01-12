
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";
import { trackApiUsage, supabase } from "./supabaseClient";

const getUserId = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id;
  } catch (e) { return null; }
};

// Inicializa a IA sempre criando uma nova instância para pegar o process.env.API_KEY atualizado
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("Aviso: API_KEY não configurada ou vazia.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

/**
 * Função auxiliar para executar chamadas com retentativa exponencial
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (retries > 0 && !isQuotaError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    
    if (isQuotaError) {
      throw new Error("QUOTA_EXHAUSTED: O limite de requisições da IA foi atingido. Tente novamente em instantes.");
    }
    throw error;
  }
}

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma questão de múltipla escolha inédita para concursos no Brasil. BANCA: "${banca}" MATÉRIA: "${materia}" NÍVEL: "${nivel}". Use 5 alternativas (A-E). Responda exclusivamente em JSON puro.`,
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

    if (!response.text) throw new Error("Resposta vazia da IA.");
    const data = JSON.parse(response.text);
    return { ...data, id: `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, banca, materia, nivel };
  });
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'EVALUATE_ESSAY').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: pureBase64, mimeType: 'image/jpeg' } },
          { text: `Avalie esta redação como corretor da banca ${banca} sobre o tema "${theme}". Retorne a análise completa em JSON.` }
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
  });
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_MINDMAP').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional mind map image about: ${prompt}. High resolution, educational layout, cyan and blue tones.` }] }
    });
    const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  });
};

export const generateStudyPlan = async (materia: Materia, horasDisponiveis: number): Promise<StudyPlanDay[]> => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'STUDY_PLAN').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um cronograma de estudo em JSON para "${materia}" distribuído em ${horasDisponiveis} horas.`,
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
            } 
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'MNEMONIC').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um mnemônico criativo para concursos sobre "${materia}". Responda em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            phrase: { type: Type.STRING }, 
            meaning: { type: Type.STRING }, 
            explanation: { type: Type.STRING } 
          } 
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 flashcards técnicos para a disciplina "${materia}". Responda em JSON.`,
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
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: `Gere apenas o título de um tema de redação provável para a banca ${banca} em 2024/2025.` 
    });
    return response.text?.trim() || "Tendências da Administração Pública";
  });
};

export const getEssayTips = async (theme: string, banca: Banca): Promise<string[]> => {
  return withRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `3 dicas de ouro para o tema "${theme}" na banca "${banca}". Retorne array JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};
