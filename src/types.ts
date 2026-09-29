export type GradeLevel =
  | 'Elementary'
  | 'Middle School'
  | 'High School'
  | 'Undergraduate'
  | 'Postgraduate / Professional';

export type SubjectCategory =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Computer Science'
  | 'History'
  | 'Literature & English'
  | 'Economics & Business'
  | 'General Science'
  | 'Other';

export type DifficultyLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Olympiad / Competitive';

export type LearningObjective =
  | 'Concept Mastery'
  | 'Exam Prep'
  | 'Homework Guidance'
  | 'Skill Practice'
  | 'Deep Research'
  | 'Quick Revision';

export interface StudentProfile {
  name: string;
  grade: GradeLevel;
  subject: SubjectCategory;
  difficulty: DifficultyLevel;
  objective: LearningObjective;
  availableTime: string;
  focusTopic?: string;
}

export type LearningMode =
  | 'explain'
  | 'simplify'
  | 'deep_dive'
  | 'quiz'
  | 'flashcards'
  | 'revision'
  | 'exam'
  | 'step_by_step'
  | 'teach_back'
  | 'summarize'
  | 'study_plan'
  | 'homework';

export interface LearningModeInfo {
  id: LearningMode;
  name: string;
  tagline: string;
  iconName: string;
  description: string;
  samplePrompt: string;
  category: 'Understand' | 'Practice' | 'Evaluate' | 'Organize';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: LearningMode;
  timestamp: number;
  liked?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  conceptTested: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
  reviewed?: boolean;
}

export interface QuizSet {
  id: string;
  topic: string;
  overview: string;
  subject: string;
  grade: string;
  questions: QuizQuestion[];
  completedAt?: number;
  scorePercentage?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  keyTerm: string;
  mnemonic?: string;
  example?: string;
  difficulty: 'fundamental' | 'core' | 'advanced';
  status?: 'unstudied' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  subject: string;
  createdAt: number;
  cards: Flashcard[];
}

export interface StudyPlanSession {
  day: string;
  focusTopic: string;
  method: string;
  durationMinutes: number;
  breakMinutes: number;
  actionItems: string[];
  quickCheckpointQuestion?: string;
  completed?: boolean;
}

export interface StudyPlanPhase {
  phaseNumber: number;
  phaseName: string;
  durationDays: number;
  objective: string;
  dailySessions: StudyPlanSession[];
}

export interface StudyPlan {
  id: string;
  planTitle: string;
  overview: string;
  subject: string;
  targetGoal: string;
  examDate?: string;
  estimatedTotalHours: number;
  phases: StudyPlanPhase[];
  examReadinessChecklist: string[];
  proStudyTips: string[];
  createdAt: number;
}

export interface TeachBackReview {
  masteryRating: 'Developing' | 'Competent' | 'Advanced' | 'Mastery';
  overallAssessment: string;
  strengths: string[];
  misconceptionsOrGaps: string[];
  howToImproveExplanation: string;
  clarifyingAnalogy?: string;
  followUpCheckpointQuestion?: string;
}

export interface SavedNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  content: string;
  mode: LearningMode;
  date: number;
}
