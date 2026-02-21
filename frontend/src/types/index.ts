// ── Request Types ──────────────────────────────────────────────────────────

export interface QuizAnswers {
  budget_from: number;
  budget_to: number;
  is_new_acceptable: boolean;
  is_used_acceptable: boolean;
  purposes: string[];
  passengers: string;
  priorities: string[];
  experience: string;
  city_size: string;
  chinese_ok: string;
}

export interface ChatContext {
  answers?: QuizAnswers;
  previous_recommendations?: Record<string, unknown>[];
}

export interface ChatRequest {
  message: string;
  context?: ChatContext;
}

// ── Response Types ─────────────────────────────────────────────────────────

export interface ProConItem {
  text: string;
  owners_count: number;
}

export interface OwnerQuote {
  text: string;
  experience: string;
  source_url: string;
}

export interface CarRecommendation {
  car_id: string;
  match_percent: number;
  why_fits: string;
  pros: ProConItem[];
  cons: ProConItem[];
  owner_quote?: OwnerQuote;
  watch_out: string;
  total_reviews: number;
}

export interface RecommendResponse {
  recommendations: CarRecommendation[];
  total_reviews_analyzed: number;
  general_advice: string;
}

export interface ChatResponse {
  reply: string;
  updated_recommendations?: CarRecommendation[];
}

export interface StatsResponse {
  total_cars: number;
  total_reviews: number;
  last_updated: string;
}

// ── App State Types ────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export type AppScreen = 'landing' | 'quiz' | 'loading' | 'results';
