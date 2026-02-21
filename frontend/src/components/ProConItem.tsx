import { Plus, Minus } from 'lucide-react';
import ReviewBadge from './ReviewBadge';

interface ProConItemProps {
  type: 'pro' | 'con';
  text: string;
  ownersCount: number;
}

export default function ProConItem({ type, text, ownersCount }: ProConItemProps) {
  const isPro = type === 'pro';

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
        isPro ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
      }`}>
        {isPro ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      </div>
      <span className="text-sm text-slate-700 flex-1">{text}</span>
      {ownersCount > 0 && <ReviewBadge count={ownersCount} />}
    </div>
  );
}
