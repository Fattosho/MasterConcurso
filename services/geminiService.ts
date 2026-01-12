
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse, Flashcard, StudyPlanDay } from "../types";
import { trackApiUsage, supabase } from "./supabaseClient";

const getUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id;
};

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  
  // Track usage de forma não-bloqueante
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma questão de múltipla escolha inédita para concursos no Brasil. BANCA: "${banca}" MATÉRIA: "${materia}" NÍVEL: "${nivel}" 5 alternativas (A-E). Responda EXCLUSIVAMENTE em JSON puro.`,
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
    console.error("Erro ao gerar questão:", error);
    throw new Error("Falha ao gerar questão pela IA.");
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
          { text: `Aja como um corretor de redação da banca ${banca}. Avalie esta redação sobre o tema "${theme}". Retorne a análise em JSON.` }
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
    console.error("Erro ao avaliar redação:", error);
    throw error;
  }
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_MINDMAP').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional educational mind map image about: ${prompt}. High resolution, clear labels, distinct blue and cyan colors, modern layout.` }] }
    });
    const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Erro ao gerar mapa mental:", error);
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
      contents: `Cronograma de estudo para "${materia}" com foco em ${horasDisponiveis} horas. Gere um array JSON de 3 atividades.`,
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
    console.error("Erro ao gerar plano de estudo:", error);
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
  } catch (error) {
    console.error("Erro ao gerar mnemônico:", error);
    throw error;
  }
};

export const generateFlashcards = async (materia: Materia): Promise<Flashcard[]> => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (userId) trackApiUsage(userId, 'GENERATE_QUESTION').catch(() => {});

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 flashcards técnicos (pergunta e resposta) para a disciplina "${materia}". Responda em JSON.`,
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
  } catch (error) {
    console.error("Erro ao gerar flashcards:", error);
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
      contents: `Gere um tema de redação curto e atual para a banca "${banca}". Retorne apenas o título.` 
    });
    return response.text?.trim() || "Tendências da Inteligência Artificial no Serviço Público";
  } catch (error) {
    console.error("Erro ao gerar tema:", error);
    return "Os desafios da sustentabilidade urbana no Brasil contemporâneo";
  }
};

export const getEssayTips = async (theme: string, banca: Banca): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dê 3 dicas estratégicas para uma redação sobre o tema "${theme}" focado na banca "${banca}". JSON array de strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Mantenha a coesão textual.", "Respeite a estrutura dissertativa.", "Atente-se à norma culta."];
  }
};
