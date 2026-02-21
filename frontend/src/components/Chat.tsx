import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { ChatMessage, QuizAnswers, CarRecommendation } from '../types';
import { sendChatMessage } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatProps {
  answers: QuizAnswers;
  recommendations: CarRecommendation[];
}

const SUGGESTIONS = [
  'А если бюджет +500к?',
  'Какая самая надёжная?',
  'Подробнее про первую модель',
  'Что лучше для города?',
];

export default function Chat({ answers, recommendations }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(messageText, {
        answers,
        previous_recommendations: recommendations.map((r) => ({
          car_id: r.car_id,
          match_percent: r.match_percent,
          why_fits: r.why_fits,
        })),
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Извините, произошла ошибка. Попробуйте ещё раз.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="gradient"
          size="icon"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="size-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <MessageCircle className="size-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] max-h-[500px] bg-card rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-[var(--color-primary-gradient)] text-primary-foreground">
        <span className="font-semibold text-sm">Уточните подбор</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 text-primary-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px]">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Задайте уточняющий вопрос:</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="block w-full text-left text-sm px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-[var(--color-primary-light)] hover:text-primary transition-all cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-primary to-[var(--color-primary-gradient)] text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="size-2 bg-muted-foreground rounded-full animate-bounce" />
                <span className="size-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="size-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задайте вопрос..."
            className="flex-1 rounded-xl bg-muted border-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="gradient"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
