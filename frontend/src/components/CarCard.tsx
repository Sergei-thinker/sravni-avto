import { Heart, ThumbsUp, ThumbsDown, ExternalLink, AlertTriangle } from 'lucide-react';
import type { CarRecommendation } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

  const carName = car_id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const matchBadgeClass =
    match_percent >= 85
      ? 'from-emerald-400 to-emerald-500 ring-4 ring-emerald-50'
      : match_percent >= 70
        ? 'from-amber-400 to-amber-500 ring-4 ring-amber-50'
        : 'from-orange-400 to-orange-500 ring-4 ring-orange-50';

  const firstUnderscore = car_id.indexOf('_');
  const brand = firstUnderscore > 0 ? car_id.slice(0, firstUnderscore) : car_id;
  const model = firstUnderscore > 0 ? car_id.slice(firstUnderscore + 1) : '';

  return (
    <Card
      className="rounded-3xl hover:shadow-lg transition-all duration-300 p-5 sm:p-6 animate-fade-in-up relative gap-0"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Rank badge for top 3 */}
      {index < 3 && (
        <Badge className="absolute -top-2.5 -left-2.5 size-8 rounded-full bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] text-primary-foreground text-xs font-bold shadow-md p-0">
          #{index + 1}
        </Badge>
      )}

      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">{carName}</h3>
            {total_reviews > 0 && (
              <div className="mt-1">
                <ReviewBadge count={total_reviews} />
                <span className="text-xs text-muted-foreground ml-1.5">проанализировано</span>
              </div>
            )}
          </div>
          <Badge className={cn('flex-shrink-0 px-3 py-1.5 rounded-xl font-bold text-sm bg-gradient-to-r text-white', matchBadgeClass)}>
            {match_percent}%
          </Badge>
        </div>

        {/* Why fits */}
        {why_fits && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Heart className="size-3.5" />
              Почему подходит вам
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{why_fits}</p>
          </div>
        )}

        {/* Pros */}
        {pros.length > 0 && (
          <div className="mb-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-success uppercase tracking-wider mb-1">
              <ThumbsUp className="size-3.5" />
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
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
              <ThumbsDown className="size-3.5" />
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
          <div className="mt-4 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-warning uppercase tracking-wider mb-1">
              <AlertTriangle className="size-3.5" />
              На что обратить внимание
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{watch_out}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild className="flex-1 rounded-xl border-2 border-primary text-primary hover:bg-[var(--color-primary-light)]">
            <a
              href={`https://www.drom.ru/reviews/${brand}/${model}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Отзывы на Дром
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="gradient" asChild className="flex-1 rounded-xl">
            <a
              href={`https://auto.ru/cars/${brand}/${model}/all/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Смотреть на Авто.ру
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
