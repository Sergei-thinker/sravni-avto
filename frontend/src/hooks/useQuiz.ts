import { useState, useCallback } from 'react';
import type { QuizAnswers } from '../types';
import { questions } from '../data/questions';

const TOTAL_STEPS = questions.length;

interface PartialAnswers {
  budget_from?: number;
  budget_to?: number;
  is_new_acceptable?: boolean;
  is_used_acceptable?: boolean;
  purposes?: string[];
  passengers?: string;
  priorities?: string[];
  experience?: string;
  city_size?: string;
  chinese_ok?: string;
}

const DEFAULT_ANSWERS: PartialAnswers = {
  budget_from: 1_000_000,
  budget_to: 3_000_000,
  is_new_acceptable: true,
  is_used_acceptable: true,
  purposes: [],
  passengers: '',
  priorities: [],
  experience: '',
  city_size: '',
  chinese_ok: '',
};

export function useQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({ ...DEFAULT_ANSWERS });

  const setAnswer = useCallback((key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const isStepValid = useCallback((): boolean => {
    const question = questions[currentStep];
    switch (question.id) {
      case 'budget':
        return (
          (answers.budget_from ?? 0) > 0 &&
          (answers.budget_to ?? 0) > 0 &&
          (answers.is_new_acceptable || answers.is_used_acceptable || false)
        );
      case 'purposes':
        return (answers.purposes?.length ?? 0) > 0;
      case 'passengers':
        return (answers.passengers?.length ?? 0) > 0;
      case 'priorities':
        return (answers.priorities?.length ?? 0) >= 3;
      case 'experience':
        return (answers.experience?.length ?? 0) > 0;
      case 'city_size':
        return (answers.city_size?.length ?? 0) > 0;
      case 'chinese_ok':
        return (answers.chinese_ok?.length ?? 0) > 0;
      default:
        return false;
    }
  }, [currentStep, answers]);

  const isComplete = currentStep === TOTAL_STEPS - 1 && isStepValid();

  const getCompleteAnswers = useCallback((): QuizAnswers => {
    return {
      budget_from: answers.budget_from ?? 1_000_000,
      budget_to: answers.budget_to ?? 3_000_000,
      is_new_acceptable: answers.is_new_acceptable ?? true,
      is_used_acceptable: answers.is_used_acceptable ?? true,
      purposes: answers.purposes ?? [],
      passengers: answers.passengers ?? '1-2',
      priorities: answers.priorities ?? [],
      experience: answers.experience ?? 'mid',
      city_size: answers.city_size ?? 'big',
      chinese_ok: answers.chinese_ok ?? 'yes',
    };
  }, [answers]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setAnswers({ ...DEFAULT_ANSWERS });
  }, []);

  const restoreAnswers = useCallback((saved: QuizAnswers) => {
    setAnswers({ ...saved });
    setCurrentStep(0);
  }, []);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    answers,
    setAnswer,
    nextStep,
    prevStep,
    isStepValid,
    isComplete,
    getCompleteAnswers,
    reset,
    restoreAnswers,
  };
}
