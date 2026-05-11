export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation?: string;
}

export interface ExamData {
  title: string;
  questions: Question[];
}
