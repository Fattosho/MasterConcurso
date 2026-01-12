
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
  if (!userId) throw new Error("Usuário não identificado.");

  const success = await trackApiUsage(userId, 'GENERATE_QUESTION');
  if (!success) throw new Error("Limite de uso atingido.");

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
    throw error;
  }
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const ai = getAIInstance();
  const userId = await getUserId();
  if (!userId) throw new Error("Não autenticado");

  const success = await trackApiUsage(userId, 'EVALUATE_ESSAY');
  if (!success) throw new Error("Limite de uso atingido.");

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
  if (!userId) throw new Error("Não autenticado");

  const success = await trackApiUsage(userId, 'GENERATE_MINDMAP');
  if (!success) throw new Error("Limite de uso atingido.");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional educational mind map image about: ${prompt}. High resolution, clear labels.` }] }
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
  if (!userId) throw new Error("Não autenticado");

  const success = await trackApiUsage(userId, 'STUDY_PLAN');
  if (!success) throw new Error("Limite de uso atingido.");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Cronograma de estudo para "${materia}" com foco em ${horasDisponiveis} horas. JSON array.`,
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
  if (!userId) throw new Error("Não autenticado");

  const success = await trackApiUsage(userId, 'MNEMONIC');
  if (!success) throw new Error("Limite de uso atingido.");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um mnemônico de concurso para "${materia}". JSON.`,
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
  if (!userId) throw new Error("Não autenticado");
  
  const success = await trackApiUsage(userId, 'GENERATE_QUESTION');
  if (!success) throw new Error("Limite de uso atingido.");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere 5 flashcards técnicos para a disciplina "${materia}". JSON.`,
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
  if (!userId) throw new Error("Não autenticado");

  // Adicionando track usage para o tema da redação
  const success = await trackApiUsage(userId, 'MNEMONIC'); // Usando custo mínimo
  if (!success) throw new Error("Limite de uso atingido.");

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: `Gere um tema de redação inédito e atual para a banca "${banca}". Retorne APENAS o título do tema em texto puro.` 
    });
    return response.text?.trim() || "Tema Indisponível no momento.";
  } catch (error) {
    console.error("Erro ao gerar tema:", error);
    throw error;
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
    console.error("Erro ao buscar dicas:", error);
    return ["Mantenha a coesão textual.", "Respeite a estrutura dissertativa.", "Atente-se à norma culta."];
  }
};
