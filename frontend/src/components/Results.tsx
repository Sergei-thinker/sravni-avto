import { Target, Lightbulb, Pencil, RotateCcw, Globe, Send } from 'lucide-react';
import type { RecommendResponse } from '../types';
import { Button } from '@/components/ui/button';
import CarCard from './CarCard';

interface ResultsProps {
  data: RecommendResponse;
  onReset: () => void;
  onEditQuery?: () => void;
}

export default function Results({ data, onReset, onEditQuery }: ResultsProps) {
  const { recommendations, total_reviews_analyzed, general_advice } = data;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="size-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            Ваши рекомендации
          </h1>
          {total_reviews_analyzed > 0 && (
            <p className="text-sm text-muted-foreground">
              Проанализировано{' '}
              <span className="font-semibold text-primary">
                {total_reviews_analyzed.toLocaleString('ru-RU')}
              </span>{' '}
              отзывов владельцев
            </p>
          )}
        </div>

        {/* General advice */}
        {general_advice && (
          <div className="bg-[var(--color-primary-light)] border-l-4 border-primary rounded-r-2xl px-5 py-4 mb-6 animate-fade-in-up">
            <div className="flex gap-3">
              <Lightbulb className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{general_advice}</p>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Топ рекомендации
          </h2>
        </div>

        {/* Car cards */}
        <div className="space-y-5 mb-8">
          {recommendations.map((rec, i) => (
            <CarCard key={rec.car_id} recommendation={rec} index={i} />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {onEditQuery && (
            <Button
              variant="outline"
              onClick={onEditQuery}
              className="flex-1 py-3 rounded-2xl border-2 border-primary text-primary hover:bg-[var(--color-primary-light)]"
            >
              <Pencil className="size-4" />
              Изменить запрос
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onReset}
            className="py-3 rounded-2xl"
          >
            <RotateCcw className="size-4" />
            Начать заново
          </Button>
        </div>

        {/* Footer links */}
        <div className="text-center pb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <p className="text-xs text-muted-foreground mb-3">Сделано в</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://create-products.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Globe className="size-4" />
              create-products.com
            </a>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="https://t.me/create_products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Send className="size-4" />
              В эпоху AI
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
