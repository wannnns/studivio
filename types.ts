export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export type ResourceType = 'flashcard' | 'note' | 'podcast' | 'video';

export interface StudySet {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: 'personal' | 'public' | 'creator'; 
  unit?: string; // New field for Cambridge Psychology Units
  content?: string; // For notes
  cards?: Flashcard[]; // For flashcards
  audioUrl?: string; // For podcasts
  videoUrl?: string; // For youtube links
  createdAt: number;
}

export type ViewState = 'dashboard' | 'create' | 'study' | 'curriculum' | 'library';

export interface LearnModeQuestion {
  cardId: string;
  term: string;
  correctDefinition: string;
  options: string[]; // Mixed correct + distractors
}

export const CAMBRIDGE_UNITS = [
  "Unit 1: Experiments and Self Reports",
  "Unit 2: Case Studies and Observations",
  "Unit 3: Correlational and Longitudinal Designs",
  "Cumulative Exam: Research Methods",
  "Unit 4: Social Approach",
  "Unit 5: Learning Approach",
  "Unit 6: Cognitive Approach",
  "Unit 7: Biological Approach"
];