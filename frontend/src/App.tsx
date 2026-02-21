import { useState, useEffect, useCallback } from 'react';
import { Frown } from 'lucide-react';
import type { AppScreen, RecommendResponse, QuizAnswers } from './types';
import { useQuiz } from './hooks/useQuiz';
import { getRecommendations, getStats } from './api/client';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Loading from './components/Loading';
import Results from './components/Results';
import Chat from './components/Chat';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<QuizAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalCars: 0, totalReviews: 0 });

  const quiz = useQuiz();

  // Fetch stats on mount (for loading screen numbers)
  useEffect(() => {
    getStats()
      .then((data) => {
        setStats({ totalCars: data.total_cars, totalReviews: data.total_reviews });
      })
      .catch(() => {
        // Stats are optional, don't block the app
      });
  }, []);

  const handleStart = useCallback(() => {
    setScreen('quiz');
  }, []);

  const handleSubmitQuiz = useCallback(async () => {
    const answers = quiz.getCompleteAnswers();
    setSubmittedAnswers(answers);
    setScreen('loading');
    setError(null);

    try {
      const data = await getRecommendations(answers);
      setResults(data);
      setScreen('results');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(message);
      setScreen('results');
    }
  }, [quiz]);

  const handleReset = useCallback(() => {
    quiz.reset();
    setResults(null);
    setSubmittedAnswers(null);
    setError(null);
    setScreen('landing');
  }, [quiz]);

  const handleEditQuery = useCallback(() => {
    if (submittedAnswers) {
      quiz.restoreAnswers(submittedAnswers);
    }
    setScreen('quiz');
  }, [quiz, submittedAnswers]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {screen === 'landing' && <Landing onStart={handleStart} />}

      {screen === 'quiz' && (
        <Quiz
          currentStep={quiz.currentStep}
          totalSteps={quiz.totalSteps}
          answers={quiz.answers as unknown as Record<string, unknown>}
          onSetAnswer={quiz.setAnswer}
          onNext={quiz.nextStep}
          onPrev={quiz.prevStep}
          onSubmit={handleSubmitQuiz}
          isStepValid={quiz.isStepValid}
          isComplete={quiz.isComplete}
        />
      )}

      {screen === 'loading' && (
        <Loading totalCars={stats.totalCars} totalReviews={stats.totalReviews} />
      )}

      {screen === 'results' && error && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Frown className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Не удалось получить рекомендации
            </h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white font-semibold text-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {screen === 'results' && results && !error && (
        <>
          <Results data={results} onReset={handleReset} onEditQuery={handleEditQuery} />
          {submittedAnswers && (
            <Chat
              answers={submittedAnswers}
              recommendations={results.recommendations}
            />
          )}
        </>
      )}
    </div>
  );
}
