import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Flashcard } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper for Base64 encoding
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Generate Flashcards
export const generateFlashcardsFromContent = async (text: string, imagePart?: any): Promise<Flashcard[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = "Generate a list of 5-10 concise flashcards (term and definition) based on the provided material. The definitions should be easy to memorize.";
  
  const contents = [];
  if (imagePart) {
    contents.push(imagePart);
  }
  contents.push({ text: prompt + "\n\nMaterial:\n" + text });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents as any }, // casting for simplicity with mixed parts
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
            },
            required: ["term", "definition"],
          },
        },
      },
    });

    const rawText = response.text;
    if (!rawText) return [];
    
    const parsed = JSON.parse(rawText);
    return parsed.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      term: item.term,
      definition: item.definition
    }));
  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    throw error;
  }
};

// Generate Podcast (TTS)
export const generatePodcastAudio = async (text: string): Promise<string | null> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  // First, generate a script if the text is raw notes
  const scriptResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Convert the following notes into a short, engaging, 2-minute podcast script for a student. Keep it conversational. \n\nNotes: ${text.substring(0, 5000)}`
  });
  
  const script = scriptResponse.text;
  if (!script) return null;

  // Now TTS
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually good for clarity
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        // Return data URI for immediate playback
        return `data:audio/wav;base64,${base64Audio}`;
    }
    return null;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};