import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CardStackItem {
  id: string | number;
  content: ReactNode;
  name: string;
  designation: string;
  avatar?: ReactNode;
}

/** Compact, opaque, auto-advancing Aceternity-style card stack. */
export function CardStack({
  items,
  offset = 10,
  scaleFactor = 0.06,
  className,
}: {
  items: CardStackItem[];
  offset?: number;
  scaleFactor?: number;
  className?: string;
}) {
  const [cards, setCards] = useState(items);
  const itemsKey = useMemo(() => items.map((item) => item.id).join('|'), [items]);

  useEffect(() => {
    const reset = window.setTimeout(() => setCards(items), 0);
    return () => window.clearTimeout(reset);
    // Reset the stack when approved-entry IDs change, without restarting on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  useEffect(() => {
    if (items.length < 2) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setCards((current) => {
        if (current.length < 2) return current;
        const next = [...current];
        next.unshift(next.pop()!);
        return next;
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [items.length]);

  const showNext = () => {
    setCards((current) => {
      if (current.length < 2) return current;
      const next = [...current];
      next.unshift(next.pop()!);
      return next;
    });
  };

  if (cards.length === 0) return null;

  const activeIndex = items.findIndex((item) => item.id === cards[0]?.id);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        layout
        transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
        className={cn('relative w-60 sm:w-72 md:w-96', className)}
      >
        {cards.slice(0, 3).map((card, index) => (
          <motion.div
            key={card.id}
            aria-hidden={index !== 0}
            className={cn(
              'flex w-full flex-col rounded-3xl border border-line-2 bg-surface p-4 shadow-xl shadow-black/20',
              index === 0 ? 'relative' : 'absolute inset-x-0 top-0',
            )}
            style={{ transformOrigin: 'top center' }}
            animate={{
              top: index * -offset,
              scale: 1 - index * scaleFactor,
              zIndex: cards.length - index,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
              {card.content}
            </div>
            <div className="mt-4 flex min-w-0 items-center gap-2.5 border-t border-line pt-3">
              {card.avatar}
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-bold text-ink">{card.name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {card.designation}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {cards.length > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <span aria-live="polite" className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {activeIndex >= 0 ? activeIndex + 1 : 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={showNext}
            aria-label="Show the next approved guestbook message"
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-2 transition-colors hover:border-accent/50 hover:text-accent"
          >
            next message <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
