export interface QuizOption {
  id: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: QuizOption[];
  correctOptionId: string; // The ID of the correct option (A, B, C, or D)
  explanation?: string; // Optional explanation if the model provides it
  boundingBox?: number[]; // [ymin, xmin, ymax, xmax] normalized to 1000
  pageNumber?: number; // 1-based page number
}

export interface QuizData {
  title: string;
  topic?: string;
  questions: Question[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface UserAnswers {
  [questionId: number]: string; // questionId -> selectedOptionId
}