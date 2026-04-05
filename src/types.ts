export type Language = 'French' | 'English' | 'Lingala' | 'Swahili' | 'Kikongo' | 'Tshiluba';

export interface VocabularyItem {
  word: string;
  translation: string;
  example: string;
}

export interface PhraseItem {
  phrase: string;
  translation: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Lesson {
  title: string;
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  grammarTip: string;
  writingExercise: {
    prompt: string;
    suggestedAnswer: string;
  };
  speakingPrompt: string;
  quiz: QuizQuestion[];
  composition?: {
    title: string;
    structure: string[];
    keyPhrases: string[];
    commonMistakes: string[];
    sample: string;
    exercise: string;
  };
}

export interface UserProgress {
  frenchLevel: string;
  englishLevel: string;
  streak: number;
  completedLessons: string[];
}
