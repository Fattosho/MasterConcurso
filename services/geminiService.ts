
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";
import { trackApiUsage, supabase } from "./supabaseClient";

const getUserId = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id;
  } catch (e) { return null; }
};

// Inicializa a IA sempre com a chave mais atual
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma questão de múltipla escolha inédita para concursos. BANCA: "${banca}" MATÉRIA: "${materia}" NÍVEL: "${nivel}". Responda APENAS o JSON.`,
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

    const data = JSON.parse(response.text || "{}");
    return { ...data, id: `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, banca, materia, nivel };
  } catch (error) {
    console.error("Erro IA Questão:", error);
    throw new Error("Falha na Inteligência Artificial ao gerar questão.");
  }
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'EVALUATE_ESSAY').catch(() => {});

  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: pureBase64, mimeType: 'image/jpeg' } },
          { text: `Avalie esta redação para a banca ${banca} sobre o tema "${theme}". Retorne a análise em JSON.` }
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
  } catch (error) {
    throw new Error("Falha na análise óptica da redação.");
  }
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_MINDMAP').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional mind map about: ${prompt}. Clean design, educational layout.` }] }
    });
    const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    return null;
  }
};

export const generateStudyPlan = async (materia: Materia, horasDisponiveis: number): Promise<StudyPlanDay[]> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'STUDY_PLAN').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um plano de estudo JSON para "${materia}" em ${horasDisponiveis}h.`,
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
  } catch (error) {
    return [];
  }
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'MNEMONIC').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um mnemônico JSON para concursos sobre "${materia}".`,
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
  } catch (error) {
    throw new Error("IA falhou ao sintetizar mnemônico.");
  }
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 flashcards JSON para "${materia}".`,
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
  } catch (error) {
    return [];
  }
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'MNEMONIC').catch(() => {});

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: `Gere APENAS o título de um tema de redação para a banca ${banca}.` 
    });
    return response.text?.trim() || "Tendências Contemporâneas na Administração";
  } catch (error) {
    return "Os Desafios do Estado Democrático de Direito";
  }
};

export const getEssayTips = async (theme: string, banca: Banca): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `3 dicas curtas para o tema "${theme}" na banca "${banca}". Retorne um array JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Mantenha a coesão.", "Foco na norma culta.", "Respeite a estrutura."];
  }
};
