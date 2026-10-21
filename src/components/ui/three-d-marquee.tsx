import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ThreeDMarqueeProps {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  duration?: number;
}

/** A 3D-styled, continuously looping strip for live, data-driven card feeds. */
export function ThreeDMarquee({
  items,
  className,
  itemClassName,
  duration = 30,
}: ThreeDMarqueeProps) {
  const reducedMotion = useReducedMotion();

  if (items.length === 0) return null;

  const cardClass = cn('w-[min(88vw,380px)] shrink-0', itemClassName);
  const cards = (copy: number) =>
    items.map((item, index) => (
      <div
        key={`${copy}-${index}`}
        className={cardClass}
        style={{ transform: 'rotateY(-3deg) rotateX(1deg)', transformStyle: 'preserve-3d' }}
      >
        {item}
      </div>
    ));

  if (reducedMotion) {
    return (
      <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
        {items.map((item, index) => (
          <div key={`static-${index}`} className={cn('w-full', itemClassName)}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden py-8 [perspective:1400px]', className)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
      }}
    >
      <motion.div
        className="flex w-max items-stretch"
        initial={{ x: '0%' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: Math.max(12, (duration * items.length) / 5),
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-stretch gap-4 pr-4"
            aria-hidden={copy > 0}
            inert={copy > 0}
          >
            {cards(copy)}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
