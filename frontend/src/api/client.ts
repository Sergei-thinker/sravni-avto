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

/**
 * Wrapper with automatic retry for network failures ("Load failed", "Failed to fetch").
 * Mobile browsers (especially Telegram in-app on iOS) drop long-running requests.
 */
async function requestWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  maxRetries = 2,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request<T>(endpoint, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isNetworkError =
        lastError.message === 'Load failed' ||
        lastError.message === 'Failed to fetch' ||
        lastError.message.includes('NetworkError') ||
        lastError.message.includes('network');
      if (!isNetworkError || attempt === maxRetries) {
        throw lastError;
      }
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastError!;
}

export async function getRecommendations(answers: QuizAnswers): Promise<RecommendResponse> {
  return requestWithRetry<RecommendResponse>('/api/recommend', {
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
