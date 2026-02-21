import { Car, Zap, MessageCircle, Gift, ChevronRight } from 'lucide-react';

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
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Car className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
          Подберём машину
          <br />
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] bg-clip-text text-transparent">
            за 2 минуты
          </span>
        </h1>
        <p className="text-lg text-slate-500 mb-8">
          На основе <span className="font-semibold text-slate-700">3 000+</span> отзывов реальных владельцев
        </p>

        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-gradient)] hover:from-[var(--color-primary-dark)] hover:to-[#5b54e0] text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Начать подбор
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-3 gap-4 max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <FeatureItem icon={<Zap className="w-5 h-5" />} title="Быстро" subtitle="7 вопросов" color="text-amber-500 bg-amber-50" />
        <FeatureItem icon={<MessageCircle className="w-5 h-5" />} title="Честно" subtitle="Реальные отзывы" color="text-blue-500 bg-blue-50" />
        <FeatureItem icon={<Gift className="w-5 h-5" />} title="Бесплатно" subtitle="Без регистрации" color="text-emerald-500 bg-emerald-50" />
      </div>

      {/* How it works */}
      <div className="mt-16 max-w-md w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
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
    <div className="text-center bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
    </div>
  );
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-gradient)] text-white flex items-center justify-center text-sm font-bold shadow-sm">
        {number}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed pt-1">{text}</p>
    </div>
  );
}
