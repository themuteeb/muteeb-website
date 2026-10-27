import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppleCardsCarouselProps {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  label?: string;
}

/** A compact, responsive, snap-scrolling card carousel for dynamic content. */
export function AppleCardsCarousel({
  items,
  className,
  itemClassName,
  label = 'Cards',
}: AppleCardsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 16;
    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      className={cn('relative', className)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            className={cn('flex w-[min(86vw,360px)] shrink-0 snap-center', itemClassName)}
          >
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={`Previous ${label.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-accent/50 hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={`Next ${label.toLowerCase()}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-accent/50 hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
