import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { questions } from '../data/questions';
import QuizQuestion from './QuizQuestion';

interface QuizProps {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, unknown>;
  onSetAnswer: (key: string, value: unknown) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isStepValid: () => boolean;
  isComplete: boolean;
}

export default function Quiz({
  currentStep,
  totalSteps,
  answers,
  onSetAnswer,
  onNext,
  onPrev,
  onSubmit,
  isStepValid,
  isComplete,
}: QuizProps) {
  const question = questions[currentStep];
  const stepValid = isStepValid();
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Progress bar - segmented */}
      <div className="max-w-lg w-full mx-auto mb-6">
        <span className="text-xs text-slate-400 font-medium block mb-3">
          Вопрос {currentStep + 1} из {totalSteps}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < currentStep
                  ? 'bg-[var(--color-primary)]'
                  : i === currentStep
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question in card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-lg w-full" key={currentStep}>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <QuizQuestion
              question={question}
              value={answers[question.id]}
              budgetFrom={answers.budget_from as number}
              budgetTo={answers.budget_to as number}
              isNewAcceptable={answers.is_new_acceptable as boolean}
              isUsedAcceptable={answers.is_used_acceptable as boolean}
              onChange={onSetAnswer}
            />
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="max-w-lg w-full mx-auto flex gap-3 pb-4 pt-6">
        {currentStep > 0 && (
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
        )}
        <button
          onClick={isLastStep && isComplete ? onSubmit : onNext}
          disabled={!stepValid}
          className={`
            flex-1 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2
            ${stepValid
              ? isLastStep
                ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white hover:shadow-lg shadow-sm'
                : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm hover:shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-4 h-4" />
              Получить рекомендации
            </>
          ) : (
            <>
              Далее
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
