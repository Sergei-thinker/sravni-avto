import { useEffect, useState, useRef } from 'react';
import { Search, BarChart3, MessageSquare, ThumbsUp, GitCompare, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingProps {
  totalCars?: number;
  totalReviews?: number;
}

const LOADING_STAGES = [
  { text: 'Собираем отзывы владельцев', icon: <MessageSquare className="size-5" />, threshold: 0 },
  { text: 'Анализируем плюсы и минусы', icon: <ThumbsUp className="size-5" />, threshold: 25 },
  { text: 'Сравниваем модели под ваши требования', icon: <GitCompare className="size-5" />, threshold: 50 },
  { text: 'Формируем рекомендации', icon: <Trophy className="size-5" />, threshold: 75 },
];

function getStageForProgress(progress: number) {
  for (let i = LOADING_STAGES.length - 1; i >= 0; i--) {
    if (progress >= LOADING_STAGES[i].threshold) return i;
  }
  return 0;
}

export default function Loading({ totalCars = 0, totalReviews = 0 }: LoadingProps) {
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Asymptotic progress: fast at start, slows down approaching ~95%
    // Never reaches 100% — that happens when results arrive and component unmounts
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000; // seconds
      // Approaches 95% over ~40s, fast initial ramp
      const newProgress = Math.min(95, 95 * (1 - Math.exp(-elapsed / 12)));
      setProgress(newProgress);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const stageIndex = getStageForProgress(progress);
  const stage = LOADING_STAGES[stageIndex];
  const displayPercent = Math.round(progress);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in-up">
        {/* Animated icons */}
        <div className="relative mb-8 inline-block">
          <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] flex items-center justify-center shadow-lg animate-pulse-slow">
            <Search className="size-10 text-primary-foreground" />
          </div>
          <div className="absolute -top-2 -right-3 size-10 rounded-xl bg-card shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <BarChart3 className="size-5 text-primary" />
          </div>
        </div>

        {/* Stage text with icon */}
        <div className="flex items-center justify-center gap-2 mb-2 min-h-[28px]">
          <span className="text-primary">{stage.icon}</span>
          <p className="text-lg font-semibold text-foreground">
            {stage.text}...
          </p>
        </div>

        {/* Stats */}
        {(totalCars > 0 || totalReviews > 0) && (
          <p className="text-sm text-muted-foreground mb-6">
            {totalReviews > 0 && (
              <>
                Анализируем{' '}
                <span className="font-semibold text-primary">{totalReviews.toLocaleString('ru-RU')}</span>{' '}
                отзывов
              </>
            )}
            {totalReviews > 0 && totalCars > 0 && ' '}
            {totalCars > 0 && (
              <>
                по{' '}
                <span className="font-semibold text-primary">{totalCars}</span>{' '}
                моделям
              </>
            )}
          </p>
        )}

        {/* Progress bar with percentage */}
        <div className="w-64 mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-sm font-medium text-muted-foreground mt-2">{displayPercent}%</p>
        </div>

        {/* Stage dots */}
        <div className="flex justify-center gap-2 mt-4">
          {LOADING_STAGES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'size-2 rounded-full transition-all duration-300',
                i <= stageIndex ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
