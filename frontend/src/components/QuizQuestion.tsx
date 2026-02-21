import { useState } from 'react';
import {
  Building2, Route, Users, Briefcase, GraduationCap, Mountain,
  Fuel, Wrench, Sofa, Shield, Sparkles, Gauge,
  ClipboardList, ShieldAlert, Car, Trophy,
  Landmark, Home, TreePine,
  CircleCheck, Search, CircleX, Check,
} from 'lucide-react';
import type { Question } from '../data/questions';

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

// Map option values to lucide-react icons
const OPTION_ICONS: Record<string, React.ReactNode> = {
  // purposes
  city: <Building2 className="w-5 h-5" />,
  highway: <Route className="w-5 h-5" />,
  family: <Users className="w-5 h-5" />,
  work: <Briefcase className="w-5 h-5" />,
  first_car: <GraduationCap className="w-5 h-5" />,
  offroad: <Mountain className="w-5 h-5" />,
  // priorities
  fuel_economy: <Fuel className="w-5 h-5" />,
  reliability: <Wrench className="w-5 h-5" />,
  comfort: <Sofa className="w-5 h-5" />,
  safety: <Shield className="w-5 h-5" />,
  looks: <Sparkles className="w-5 h-5" />,
  dynamics: <Gauge className="w-5 h-5" />,
  // passengers
  '1-2': <Car className="w-5 h-5" />,
  '3-4': <Users className="w-5 h-5" />,
  '5+': <Users className="w-5 h-5" />,
  // experience
  none: <ClipboardList className="w-5 h-5" />,
  junior: <ShieldAlert className="w-5 h-5" />,
  mid: <Car className="w-5 h-5" />,
  senior: <Trophy className="w-5 h-5" />,
  // city_size
  big: <Landmark className="w-5 h-5" />,
  medium: <Home className="w-5 h-5" />,
  small: <TreePine className="w-5 h-5" />,
  // chinese_ok
  yes: <CircleCheck className="w-5 h-5" />,
  proven: <Search className="w-5 h-5" />,
  no: <CircleX className="w-5 h-5" />,
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
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        {question.title}
      </h2>
      {question.subtitle && (
        <p className="text-sm text-slate-500 mb-6">{question.subtitle}</p>
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
      <div className="text-center py-3 px-4 bg-[var(--color-primary-light)] rounded-2xl">
        <span className="text-lg font-bold text-[var(--color-primary)]">
          {formatBudget(budgetFrom)} — {formatBudget(budgetTo)} руб.
        </span>
      </div>

      {/* From slider */}
      <div>
        <label className="text-sm font-medium text-slate-600 mb-2 block">
          От: <span className="text-[var(--color-primary)] font-bold">{formatBudget(budgetFrom)}</span>
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
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
          {BUDGET_MARKS.map((m) => (
            <span key={m.value}>{m.label}</span>
          ))}
        </div>
      </div>

      {/* To slider */}
      <div>
        <label className="text-sm font-medium text-slate-600 mb-2 block">
          До: <span className="text-[var(--color-primary)] font-bold">{formatBudget(budgetTo)}</span>
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
        <button
          type="button"
          onClick={() => onChange('is_new_acceptable', !isNewAcceptable)}
          className={`flex-1 py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
            isNewAcceptable
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              : 'border-slate-200 text-slate-400 hover:border-slate-300'
          }`}
        >
          {isNewAcceptable && <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
          Новые
        </button>
        <button
          type="button"
          onClick={() => onChange('is_used_acceptable', !isUsedAcceptable)}
          className={`flex-1 py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
            isUsedAcceptable
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              : 'border-slate-200 text-slate-400 hover:border-slate-300'
          }`}
        >
          {isUsedAcceptable && <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
          С пробегом
        </button>
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
            className={`
              relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer
              ${isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            <span className={`flex-shrink-0 ${isSelected ? 'text-[var(--color-primary)]' : 'text-slate-400'}`}>
              {icon || <span className="text-xl">{option.icon}</span>}
            </span>
            <span className={`text-sm font-medium ${isSelected ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>
              {option.label}
            </span>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-[var(--color-primary)]" />
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
            className={`
              w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer
              ${isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            <span className={`flex-shrink-0 ${isSelected ? 'text-[var(--color-primary)]' : 'text-slate-400'}`}>
              {icon || <span className="text-xl">{option.icon}</span>}
            </span>
            <span className={`text-sm font-medium ${isSelected ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>
              {option.label}
            </span>
            {isSelected && (
              <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {!isSelected && (
              <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-200" />
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
            className={`
              w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer
              ${isRanked
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            {isRanked ? (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {rankIndex + 1}
              </span>
            ) : (
              <span className="flex-shrink-0 w-7 text-center text-slate-400">
                {icon || <span className="text-xl">{option.icon}</span>}
              </span>
            )}
            <span className={`text-sm font-medium ${isRanked ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>
              {option.label}
            </span>
          </button>
        );
      })}
      {ranked.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-2">
          Нажмите на выбранный пункт, чтобы отменить выбор
        </p>
      )}
    </div>
  );
}
