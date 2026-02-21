import { Car, Zap, MessageCircle, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-light)] via-transparent to-transparent -z-10" />

      {/* Hero Section */}
      <div className="text-center max-w-lg animate-fade-in-up">
        <div className="size-20 rounded-3xl bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Car className="size-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 leading-tight">
          Подберём машину
          <br />
          <span className="bg-gradient-to-r from-primary to-[var(--color-primary-gradient)] bg-clip-text text-transparent">
            за 2 минуты
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          На основе <span className="font-semibold text-foreground">3 000+</span> отзывов реальных владельцев
        </p>

        <Button
          variant="gradient"
          size="lg"
          onClick={onStart}
          className="text-lg px-8 py-6 rounded-2xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Начать подбор
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-3 gap-4 max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <FeatureItem icon={<Zap className="size-5" />} title="Быстро" subtitle="7 вопросов" color="text-amber-500 bg-amber-50" />
        <FeatureItem icon={<MessageCircle className="size-5" />} title="Честно" subtitle="Реальные отзывы" color="text-blue-500 bg-blue-50" />
        <FeatureItem icon={<Gift className="size-5" />} title="Бесплатно" subtitle="Без регистрации" color="text-emerald-500 bg-emerald-50" />
      </div>

      {/* How it works */}
      <div className="mt-16 max-w-md w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          Как это работает
        </h2>
        <div className="space-y-4">
          <StepItem number={1} text="Ответьте на 7 простых вопросов о ваших потребностях" />
          <StepItem number={2} text="ИИ проанализирует тысячи отзывов реальных владельцев" />
          <StepItem number={3} text="Получите 3-5 лучших моделей с подробным разбором" />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <Card className="text-center border-border/50 py-4 gap-2">
      <CardContent className="px-4 py-0">
        <div className={cn('size-10 rounded-xl flex items-center justify-center mx-auto mb-2', color)}>
          {icon}
        </div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 size-8 rounded-full bg-gradient-to-br from-primary to-[var(--color-primary-gradient)] text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
        {number}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed pt-1">{text}</p>
    </div>
  );
}
