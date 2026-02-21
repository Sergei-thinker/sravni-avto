import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { questions } from '../data/questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <span className="text-xs text-muted-foreground font-medium block mb-3">
          Вопрос {currentStep + 1} из {totalSteps}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                i <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Question in card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-lg w-full" key={currentStep}>
          <Card className="rounded-3xl p-6 sm:p-8 gap-0">
            <CardContent className="p-0">
              <QuizQuestion
                question={question}
                value={answers[question.id]}
                budgetFrom={answers.budget_from as number}
                budgetTo={answers.budget_to as number}
                isNewAcceptable={answers.is_new_acceptable as boolean}
                isUsedAcceptable={answers.is_used_acceptable as boolean}
                onChange={onSetAnswer}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="max-w-lg w-full mx-auto flex gap-3 pb-4 pt-6">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={onPrev}
            className="rounded-2xl"
          >
            <ChevronLeft className="size-4" />
            Назад
          </Button>
        )}
        <Button
          onClick={isLastStep && isComplete ? onSubmit : onNext}
          disabled={!stepValid}
          variant={isLastStep ? 'gradient' : 'default'}
          className="flex-1 py-3 rounded-2xl font-semibold"
        >
          {isLastStep ? (
            <>
              <Sparkles className="size-4" />
              Получить рекомендации
            </>
          ) : (
            <>
              Далее
              <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
