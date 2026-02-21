import type { QuizAnswers, RecommendResponse, ChatResponse, ChatContext, StatsResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function getRecommendations(answers: QuizAnswers): Promise<RecommendResponse> {
  return request<RecommendResponse>('/api/recommend', {
    method: 'POST',
    body: JSON.stringify(answers),
  });
}

export async function sendChatMessage(
  message: string,
  context?: ChatContext
): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}

export async function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>('/api/stats');
}
