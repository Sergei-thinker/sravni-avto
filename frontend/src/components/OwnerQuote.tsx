import { Quote, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OwnerQuoteProps {
  text: string;
  experience: string;
  sourceUrl?: string;
}

export default function OwnerQuote({ text, experience, sourceUrl }: OwnerQuoteProps) {
  return (
    <div className={cn(
      'relative border-l-4 border-primary bg-muted rounded-r-xl px-4 py-3 my-3 overflow-hidden'
    )}>
      <Quote className="absolute top-2 right-2 size-8 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground italic leading-relaxed relative">
        &laquo;{text}&raquo;
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground relative">
        {experience && (
          <>
            <User className="size-3" />
            <span>{experience}</span>
          </>
        )}
        {experience && sourceUrl && <span>&middot;</span>}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Источник
          </a>
        )}
      </div>
    </div>
  );
}
