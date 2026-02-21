import { Target, Lightbulb, Pencil, RotateCcw } from 'lucide-react';
import type { RecommendResponse } from '../types';
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Ваши рекомендации
          </h1>
          {total_reviews_analyzed > 0 && (
            <p className="text-sm text-slate-500">
              Проанализировано{' '}
              <span className="font-semibold text-[var(--color-primary)]">
                {total_reviews_analyzed.toLocaleString('ru-RU')}
              </span>{' '}
              отзывов владельцев
            </p>
          )}
        </div>

        {/* General advice */}
        {general_advice && (
          <div className="bg-[var(--color-primary-light)] border-l-4 border-[var(--color-primary)] rounded-r-2xl px-5 py-4 mb-6 animate-fade-in-up">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 leading-relaxed">{general_advice}</p>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
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
            <button
              onClick={onEditQuery}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[var(--color-primary-light)] transition-all duration-200 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Изменить запрос
            </button>
          )}
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Начать заново
          </button>
        </div>
      </div>
    </div>
  );
}
