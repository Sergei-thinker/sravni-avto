import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReviewBadgeProps {
  count: number;
  className?: string;
}

export default function ReviewBadge({ count, className }: ReviewBadgeProps) {
  const label = getOwnersLabel(count);

  return (
    <Badge variant="secondary" className={cn('gap-1', className)}>
      <Users className="size-3" />
      {count} {label}
    </Badge>
  );
}

function getOwnersLabel(n: number): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;

  if (abs >= 11 && abs <= 19) return 'владельцев';
  if (lastDigit === 1) return 'владелец';
  if (lastDigit >= 2 && lastDigit <= 4) return 'владельца';
  return 'владельцев';
}
