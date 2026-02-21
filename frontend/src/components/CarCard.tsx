import { Heart, ThumbsUp, ThumbsDown, ExternalLink, AlertTriangle } from 'lucide-react';
import type { CarRecommendation } from '../types';
import ProConItemComponent from './ProConItem';
import OwnerQuoteComponent from './OwnerQuote';
import ReviewBadge from './ReviewBadge';

interface CarCardProps {
  recommendation: CarRecommendation;
  index: number;
}

export default function CarCard({ recommendation, index }: CarCardProps) {
  const {
    car_id,
    match_percent,
    why_fits,
    pros,
    cons,
    owner_quote,
    watch_out,
    total_reviews,
  } = recommendation;

  // Parse car_id format: "brand_model" or "Brand Model"
  const carName = car_id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const matchBadgeClass =
    match_percent >= 85
      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white ring-4 ring-emerald-50'
      : match_percent >= 70
        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white ring-4 ring-amber-50'
        : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white ring-4 ring-orange-50';

  // Build external links from car_id (e.g. "haval_jolion" -> brand="haval", model="jolion")
  const firstUnderscore = car_id.indexOf('_');
  const brand = firstUnderscore > 0 ? car_id.slice(0, firstUnderscore) : car_id;
  const model = firstUnderscore > 0 ? car_id.slice(firstUnderscore + 1) : '';

  return (
    <div
      className="bg-white rounded-3xl shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-300 ease-in-out p-5 sm:p-6 animate-fade-in-up relative"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Rank badge for top 3 */}
      {index < 3 && (
        <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white flex items-center justify-center text-xs font-bold shadow-md">
          #{index + 1}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">{carName}</h3>
          {total_reviews > 0 && (
            <div className="mt-1">
              <ReviewBadge count={total_reviews} />
              <span className="text-xs text-slate-400 ml-1.5">проанализировано</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-bold text-sm ${matchBadgeClass}`}>
          {match_percent}%
        </div>
      </div>

      {/* Why fits */}
      {why_fits && (
        <div className="mb-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <Heart className="w-3.5 h-3.5" />
            Почему подходит вам
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">{why_fits}</p>
        </div>
      )}

      {/* Pros */}
      {pros.length > 0 && (
        <div className="mb-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            Плюсы
          </h4>
          {pros.map((pro, i) => (
            <ProConItemComponent
              key={i}
              type="pro"
              text={pro.text}
              ownersCount={pro.owners_count}
            />
          ))}
        </div>
      )}

      {/* Cons */}
      {cons.length > 0 && (
        <div className="mb-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">
            <ThumbsDown className="w-3.5 h-3.5" />
            Минусы
          </h4>
          {cons.map((con, i) => (
            <ProConItemComponent
              key={i}
              type="con"
              text={con.text}
              ownersCount={con.owners_count}
            />
          ))}
        </div>
      )}

      {/* Owner quote */}
      {owner_quote && (
        <OwnerQuoteComponent
          text={owner_quote.text}
          experience={owner_quote.experience}
          sourceUrl={owner_quote.source_url}
        />
      )}

      {/* Watch out */}
      {watch_out && (
        <div className="mt-4 bg-[var(--color-warning-light)] border border-amber-200 rounded-xl px-4 py-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            На что обратить внимание
          </h4>
          <p className="text-sm text-amber-800 leading-relaxed">{watch_out}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <a
          href={`https://www.drom.ru/reviews/${brand}/${model}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-center py-2.5 px-4 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-medium text-sm hover:bg-[var(--color-primary-light)] transition-all duration-200"
        >
          Отзывы на Дром
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={`https://auto.ru/cars/${brand}/${model}/all/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white font-medium text-sm hover:shadow-md transition-all duration-200"
        >
          Смотреть на Авто.ру
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
