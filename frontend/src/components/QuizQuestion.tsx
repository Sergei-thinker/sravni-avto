import { useState } from 'react';
import {
  Building2, Route, Users, Briefcase, GraduationCap, Mountain,
  Fuel, Wrench, Sofa, Shield, Sparkles, Gauge,
  ClipboardList, ShieldAlert, Car, Trophy,
  Landmark, Home, TreePine,
  CircleCheck, Search, CircleX, Check,
} from 'lucide-react';
import type { Question } from '../data/questions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: Question;
  value: unknown;
  budgetFrom?: number;
  budgetTo?: number;
  isNewAcceptable?: boolean;
  isUsedAcceptable?: boolean;
  onChange: (key: string, value: unknown) => void;
}

const BUDGET_MARKS = [
  { value: 500_000, label: '500 т' },
  { value: 1_000_000, label: '1 млн' },
  { value: 1_500_000, label: '1.5 млн' },
  { value: 2_000_000, label: '2 млн' },
  { value: 3_000_000, label: '3 млн' },
  { value: 4_000_000, label: '4 млн' },
  { value: 5_000_000, label: '5 млн' },
  { value: 6_000_000, label: '6 млн' },
  { value: 8_000_000, label: '8+ млн' },
];

const OPTION_ICONS: Record<string, React.ReactNode> = {
  city: <Building2 className="size-5" />,
  highway: <Route className="size-5" />,
  family: <Users className="size-5" />,
  work: <Briefcase className="size-5" />,
  first_car: <GraduationCap className="size-5" />,
  offroad: <Mountain className="size-5" />,
  fuel_economy: <Fuel className="size-5" />,
  reliability: <Wrench className="size-5" />,
  comfort: <Sofa className="size-5" />,
  safety: <Shield className="size-5" />,
  looks: <Sparkles className="size-5" />,
  dynamics: <Gauge className="size-5" />,
  '1-2': <Car className="size-5" />,
  '3-4': <Users className="size-5" />,
  '5+': <Users className="size-5" />,
  none: <ClipboardList className="size-5" />,
  junior: <ShieldAlert className="size-5" />,
  mid: <Car className="size-5" />,
  senior: <Trophy className="size-5" />,
  big: <Landmark className="size-5" />,
  medium: <Home className="size-5" />,
  small: <TreePine className="size-5" />,
  yes: <CircleCheck className="size-5" />,
  proven: <Search className="size-5" />,
  no: <CircleX className="size-5" />,
};

function formatBudget(value: number): string {
  if (value >= 8_000_000) return '8+ млн';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} млн`;
  }
  return `${(value / 1_000).toFixed(0)} тыс`;
}

export default function QuizQuestion({
  question,
  value,
  budgetFrom = 1_000_000,
  budgetTo = 3_000_000,
  isNewAcceptable = true,
  isUsedAcceptable = true,
  onChange,
}: QuizQuestionProps) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        {question.title}
      </h2>
      {question.subtitle && (
        <p className="text-sm text-muted-foreground mb-6">{question.subtitle}</p>
      )}

      {question.type === 'budget' && (
        <BudgetQuestion
          budgetFrom={budgetFrom}
          budgetTo={budgetTo}
          isNewAcceptable={isNewAcceptable}
          isUsedAcceptable={isUsedAcceptable}
          onChange={onChange}
        />
      )}

      {question.type === 'multi-select' && (
        <MultiSelectQuestion
          options={question.options ?? []}
          selected={(value as string[]) || []}
          questionId={question.id}
          onChange={onChange}
        />
      )}

      {question.type === 'single-select' && (
        <SingleSelectQuestion
          options={question.options ?? []}
          selected={(value as string) || ''}
          questionId={question.id}
          onChange={onChange}
        />
      )}

      {question.type === 'ranking' && (
        <RankingQuestion
          options={question.options ?? []}
          ranked={(value as string[]) || []}
          questionId={question.id}
          onChange={onChange}
        />
      )}
    </div>
  );
}

/* ── Budget Question ─────────────────────────────────────────────── */

function BudgetQuestion({
  budgetFrom,
  budgetTo,
  isNewAcceptable,
  isUsedAcceptable,
  onChange,
}: {
  budgetFrom: number;
  budgetTo: number;
  isNewAcceptable: boolean;
  isUsedAcceptable: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  const fromIndex = BUDGET_MARKS.findIndex((m) => m.value >= budgetFrom);
  const toIndex = BUDGET_MARKS.findIndex((m) => m.value >= budgetTo);

  return (
    <div className="space-y-6">
      {/* Budget display */}
      <div className="text-center py-3 px-4 bg-secondary rounded-2xl">
        <span className="text-lg font-bold text-primary">
          {formatBudget(budgetFrom)} — {formatBudget(budgetTo)} руб.
        </span>
      </div>

      {/* From slider */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          От: <span className="text-primary font-bold">{formatBudget(budgetFrom)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={BUDGET_MARKS.length - 1}
          step={1}
          value={fromIndex >= 0 ? fromIndex : 0}
          onChange={(e) => {
            const newFrom = BUDGET_MARKS[Number(e.target.value)].value;
            onChange('budget_from', newFrom);
            if (newFrom > budgetTo) {
              onChange('budget_to', newFrom);
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
          {BUDGET_MARKS.map((m) => (
            <span key={m.value}>{m.label}</span>
          ))}
        </div>
      </div>

      {/* To slider */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          До: <span className="text-primary font-bold">{formatBudget(budgetTo)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={BUDGET_MARKS.length - 1}
          step={1}
          value={toIndex >= 0 ? toIndex : BUDGET_MARKS.length - 1}
          onChange={(e) => {
            const newTo = BUDGET_MARKS[Number(e.target.value)].value;
            onChange('budget_to', newTo);
            if (newTo < budgetFrom) {
              onChange('budget_from', newTo);
            }
          }}
          className="w-full"
        />
      </div>

      {/* New/Used pill buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange('is_new_acceptable', !isNewAcceptable)}
          className={cn(
            'flex-1 py-3 rounded-2xl border-2 transition-all',
            isNewAcceptable
              ? 'border-primary bg-secondary text-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground'
          )}
        >
          {isNewAcceptable && <Check className="size-4" />}
          Новые
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange('is_used_acceptable', !isUsedAcceptable)}
          className={cn(
            'flex-1 py-3 rounded-2xl border-2 transition-all',
            isUsedAcceptable
              ? 'border-primary bg-secondary text-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground'
          )}
        >
          {isUsedAcceptable && <Check className="size-4" />}
          С пробегом
        </Button>
      </div>
    </div>
  );
}

/* ── Multi-Select Question ───────────────────────────────────────── */

function MultiSelectQuestion({
  options,
  selected,
  questionId,
  onChange,
}: {
  options: { value: string; label: string; icon?: string }[];
  selected: string[];
  questionId: string;
  onChange: (key: string, value: unknown) => void;
}) {
  const toggle = (val: string) => {
    const newSelected = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    onChange(questionId, newSelected);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const icon = OPTION_ICONS[option.value];
        return (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
              isSelected
                ? 'border-primary bg-secondary shadow-sm'
                : 'border-border bg-card hover:border-muted-foreground hover:shadow-sm'
            )}
          >
            <span className={cn('flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
              {icon || <span className="text-xl">{option.icon}</span>}
            </span>
            <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
              {option.label}
            </span>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="size-4 text-primary" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Single-Select Question ──────────────────────────────────────── */

function SingleSelectQuestion({
  options,
  selected,
  questionId,
  onChange,
}: {
  options: { value: string; label: string; icon?: string }[];
  selected: string;
  questionId: string;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected === option.value;
        const icon = OPTION_ICONS[option.value];
        return (
          <button
            key={option.value}
            onClick={() => onChange(questionId, option.value)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
              isSelected
                ? 'border-primary bg-secondary shadow-sm'
                : 'border-border bg-card hover:border-muted-foreground hover:shadow-sm'
            )}
          >
            <span className={cn('flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
              {icon || <span className="text-xl">{option.icon}</span>}
            </span>
            <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
              {option.label}
            </span>
            {isSelected ? (
              <div className="ml-auto flex-shrink-0 size-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="size-3.5 text-primary-foreground" />
              </div>
            ) : (
              <div className="ml-auto flex-shrink-0 size-6 rounded-full border-2 border-border" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Ranking Question ────────────────────────────────────────────── */

function RankingQuestion({
  options,
  ranked,
  questionId,
  onChange,
}: {
  options: { value: string; label: string; icon?: string }[];
  ranked: string[];
  questionId: string;
  onChange: (key: string, value: unknown) => void;
}) {
  const [, setForceUpdate] = useState(0);

  const handleClick = (val: string) => {
    let newRanked: string[];
    if (ranked.includes(val)) {
      const idx = ranked.indexOf(val);
      newRanked = ranked.slice(0, idx);
    } else {
      newRanked = [...ranked, val];
    }
    onChange(questionId, newRanked);
    setForceUpdate((prev) => prev + 1);
  };

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const rankIndex = ranked.indexOf(option.value);
        const isRanked = rankIndex >= 0;
        const icon = OPTION_ICONS[option.value];
        return (
          <button
            key={option.value}
            onClick={() => handleClick(option.value)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
              isRanked
                ? 'border-primary bg-secondary shadow-sm'
                : 'border-border bg-card hover:border-muted-foreground hover:shadow-sm'
            )}
          >
            {isRanked ? (
              <span className="flex-shrink-0 size-7 rounded-full bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                {rankIndex + 1}
              </span>
            ) : (
              <span className="flex-shrink-0 w-7 text-center text-muted-foreground">
                {icon || <span className="text-xl">{option.icon}</span>}
              </span>
            )}
            <span className={cn('text-sm font-medium', isRanked ? 'text-primary' : 'text-foreground')}>
              {option.label}
            </span>
          </button>
        );
      })}
      {ranked.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Нажмите на выбранный пункт, чтобы отменить выбор
        </p>
      )}
    </div>
  );
}
