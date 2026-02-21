import { useEffect, useState } from 'react';
import { Search, BarChart3, MessageSquare, ThumbsUp, GitCompare, Trophy } from 'lucide-react';

interface LoadingProps {
  totalCars?: number;
  totalReviews?: number;
}

const LOADING_STAGES = [
  { text: 'Собираем отзывы владельцев', icon: <MessageSquare className="w-5 h-5" /> },
  { text: 'Анализируем плюсы и минусы', icon: <ThumbsUp className="w-5 h-5" /> },
  { text: 'Сравниваем модели под ваши требования', icon: <GitCompare className="w-5 h-5" /> },
  { text: 'Формируем рекомендации', icon: <Trophy className="w-5 h-5" /> },
];

export default function Loading({ totalCars = 0, totalReviews = 0 }: LoadingProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 2500);
    return () => clearInterval(stageInterval);
  }, []);

  const progress = ((stageIndex + 1) / LOADING_STAGES.length) * 100;
  const stage = LOADING_STAGES[stageIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in-up">
        {/* Animated icons */}
        <div className="relative mb-8 inline-block">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] flex items-center justify-center shadow-lg animate-pulse-slow">
            <Search className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-3 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        </div>

        {/* Stage text with icon */}
        <div className="flex items-center justify-center gap-2 mb-2 min-h-[28px]">
          <span className="text-[var(--color-primary)]">{stage.icon}</span>
          <p className="text-lg font-semibold text-slate-800">
            {stage.text}...
          </p>
        </div>

        {/* Stats */}
        {(totalCars > 0 || totalReviews > 0) && (
          <p className="text-sm text-slate-500 mb-6">
            {totalReviews > 0 && (
              <>
                Анализируем{' '}
                <span className="font-semibold text-[var(--color-primary)]">{totalReviews.toLocaleString('ru-RU')}</span>{' '}
                отзывов
              </>
            )}
            {totalReviews > 0 && totalCars > 0 && ' '}
            {totalCars > 0 && (
              <>
                по{' '}
                <span className="font-semibold text-[var(--color-primary)]">{totalCars}</span>{' '}
                моделям
              </>
            )}
          </p>
        )}

        {/* Progress bar - stage-based */}
        <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage dots */}
        <div className="flex justify-center gap-2 mt-4">
          {LOADING_STAGES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= stageIndex ? 'bg-[var(--color-primary)]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
