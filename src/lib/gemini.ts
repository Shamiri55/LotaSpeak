import { GoogleGenAI, Type, Modality } from "@google/genai";
import { handleAppError } from "./utils";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getAIResponse = async (prompt: string, systemInstruction?: string) => {
  const model = "gemini-3-flash-preview";
  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    handleAppError(error, "AI Tutor");
    return "Désolé, je rencontre un problème technique. Réessayez dans un instant.";
  }
};

export const generateSpeech = async (text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    handleAppError(error, "Speech Synthesis");
    return null;
  }
};

export const getPronunciationFeedback = async (base64Audio: string, mimeType: string, language: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Listen to this audio in ${language}. 
  Perform a deep analysis of the pronunciation.
  Provide:
  1. Transcription of what was said.
  2. Overall pronunciation score (0-100).
  3. Detailed feedback on specific sounds, phonemes, or words that need improvement.
  4. Specific tips for improvement (e.g., "Place your tongue behind your teeth for the 'th' sound").
  5. A friendly and encouraging summary.
  
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Audio, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            score: { type: Type.NUMBER },
            detailedFeedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phoneme: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  tip: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse pronunciation JSON:", e);
      return { summary: response.text };
    }
  } catch (error) {
    handleAppError(error, "Pronunciation Feedback");
    return { summary: "Impossible d'analyser votre prononciation pour le moment." };
  }
};

export const generateLesson = async (language: string, level: string, topic: string) => {
  const prompt = `Generate a comprehensive language lesson for learning ${language} at ${level} level about the topic: "${topic}". 
  The lesson should be engaging and educational.
  Include:
  1. A catchy title.
  2. Key vocabulary: 5-7 words with their translations, a short example sentence for each, and a HIGHLY SPECIFIC image keyword.
     CRITICAL: The imageKeyword MUST be a single word or hyphenated phrase that directly and literally represents the vocabulary word (e.g., if the word is "voiture", the keyword MUST be "car" or "automobile"). 
     For cultural context, you can append "-rdc" or "-africa" to the keyword (e.g., "market-rdc", "taxi-kinshasa") to ensure the image reflects the Congolese daily life while still being a literal representation of the word.
  3. 3-5 essential phrases used in real-life situations related to the topic.
  4. A clear and concise grammar tip relevant to the level and topic.
  5. A writing exercise: a prompt for the user to write something related to the topic, and a suggested correct answer.
  6. A speaking prompt: a sentence or question for the user to practice saying aloud.
  7. An interactive quiz with 3-5 multiple-choice questions.
  
  If the language is French or a Congolese national language (Lingala, Swahili, Kikongo, Tshiluba), include cultural references or common expressions used in the Democratic Republic of Congo (RDC) that people encounter in their daily lives.
  
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  example: { type: Type.STRING },
                  imageKeyword: { type: Type.STRING }
                }
              }
            },
            phrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  translation: { type: Type.STRING }
                }
              }
            },
            grammarTip: { type: Type.STRING },
            writingExercise: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                suggestedAnswer: { type: Type.STRING }
              }
            },
            speakingPrompt: { type: Type.STRING },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse lesson JSON:", e);
      return {};
    }
  } catch (error) {
    handleAppError(error, "Generate Lesson");
    return {};
  }
};

export const translateText = async (text: string, from: string, to: string) => {
  const prompt = `Translate the following text from ${from} to ${to}: "${text}". Only return the translated text without any explanation.`;
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    handleAppError(error, "Translation");
    return text; // Return original text as fallback
  }
};

export const getDictionaryEntry = async (query: string, language: string, searchType: 'word' | 'semantic' = 'word') => {
  const prompt = searchType === 'word' 
    ? `Provide a dictionary entry for the word "${query}" in ${language}.`
    : `Find the word in ${language} that best matches this description or example: "${query}". Provide its dictionary entry.`;

  const fullPrompt = `${prompt}
  Include:
  1. The word itself.
  2. Definition.
  3. Part of speech.
  4. 2 example sentences.
  5. Synonyms (if any).
  6. Antonyms (if any).
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            antonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse dictionary JSON:", e);
      return null;
    }
  } catch (error) {
    handleAppError(error, "Dictionary Entry");
    return null;
  }
};

export const generatePlacementTest = async (language: string) => {
  const prompt = `Generate a placement test for ${language} to evaluate the user's level (Beginner, Intermediate, Advanced).
  Include 10 multiple-choice questions of increasing difficulty.
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING, description: "beginner, intermediate, or advanced" }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    handleAppError(error, "Placement Test");
    return null;
  }
};
export const analyzeText = async (text: string, language: string) => {
  const prompt = `Analyze the following ${language} text for spelling (orthographe), grammatical analysis (analyse), and logical coherence (logique): "${text}".
  Provide:
  1. Corrected version of the text.
  2. Detailed list of spelling and grammar errors.
  3. Logical analysis of the text (coherence, flow, structure).
  4. Grammatical analysis of key parts (e.g., verb conjugations, sentence structure).
  5. Overall quality score (0-100).
  
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedText: { type: Type.STRING },
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "spelling, grammar, or logic" },
                  original: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            logicalAnalysis: { type: Type.STRING },
            grammaticalAnalysis: { type: Type.STRING },
            score: { type: Type.NUMBER }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
      return null;
    }
  } catch (error) {
    handleAppError(error, "Text Analysis");
    return null;
  }
};

export const generateCompositionLesson = async (language: string, documentType: string) => {
  const prompt = `Teach the user how to write a good "${documentType}" in ${language}.
  Include:
  1. Structure of the document (Introduction, Body, Conclusion, etc.).
  2. Key formal/informal phrases to use.
  3. Common mistakes to avoid.
  4. A sample template or example.
  5. A practical exercise for the user.
  
  Return the response in JSON format.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            structure: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            sample: { type: Type.STRING },
            exercise: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    handleAppError(error, "Composition Lesson");
    return null;
  }
};
