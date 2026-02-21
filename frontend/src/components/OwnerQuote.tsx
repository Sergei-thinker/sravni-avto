import { Quote, User } from 'lucide-react';

interface OwnerQuoteProps {
  text: string;
  experience: string;
  sourceUrl?: string;
}

export default function OwnerQuote({ text, experience, sourceUrl }: OwnerQuoteProps) {
  return (
    <div className="relative border-l-4 border-[var(--color-primary)] bg-slate-50 rounded-r-xl px-4 py-3 my-3 overflow-hidden">
      {/* Decorative quote icon */}
      <Quote className="absolute top-2 right-2 w-8 h-8 text-slate-200" />
      <p className="text-sm text-slate-700 italic leading-relaxed relative">
        &laquo;{text}&raquo;
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 relative">
        {experience && (
          <>
            <User className="w-3 h-3" />
            <span>{experience}</span>
          </>
        )}
        {experience && sourceUrl && <span>&middot;</span>}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Источник
          </a>
        )}
      </div>
    </div>
  );
}
