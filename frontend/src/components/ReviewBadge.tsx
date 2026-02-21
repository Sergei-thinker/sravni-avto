import { Users } from 'lucide-react';

interface ReviewBadgeProps {
  count: number;
  className?: string;
}

export default function ReviewBadge({ count, className = '' }: ReviewBadgeProps) {
  const label = getOwnersLabel(count);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-medium ${className}`}
    >
      <Users className="w-3 h-3" />
      {count} {label}
    </span>
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
