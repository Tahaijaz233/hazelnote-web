export interface StudySet {
  id: number;
  title: string;
  date: string;
  summary: string;
  flashcardCount: number;
  quizCount: number;
  parts: string[];
  podcast: string;
  chatCount: number;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  emoji: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface UserStats {
  streak: number;
  notes: number;
  lastDate: string | null;
  monthlySets: Record<string, number>;
}

export interface UserProfile {
  full_name: string;
  email: string;
  tier: 'free' | 'pro';
  is_pro: boolean;
  created_at: Date;
  monthly_sets: Record<string, number>;
  total_sets_created: number;
  last_active: Date;
  stats?: UserStats;
  folders?: Folder[];
  chat_stats?: {
    date: string;
    count: number;
  };
}

export interface PDFFile {
  mimeType: string;
  data: string;
  name: string;
}
