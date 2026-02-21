import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      <div className={cn(
        'flex-shrink-0 mt-0.5 size-5 rounded-full flex items-center justify-center',
        isPro ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      )}>
        {isPro ? <Plus className="size-3" /> : <Minus className="size-3" />}
      </div>
      <span className="text-sm text-muted-foreground flex-1">{text}</span>
      {ownersCount > 0 && <ReviewBadge count={ownersCount} />}
    </div>
  );
}
