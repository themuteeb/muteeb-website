import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — LayoutTextFlip
 * Flips through a list of words with a vertical flip animation —
 * used here for the boot / loading experience.
 * https://ui.aceternity.com/components/layout-text-flip
 */
export function LayoutTextFlip({
  words,
  interval = 4000,
  className,
  textClassName,
}: {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className={cn('inline-block whitespace-nowrap', textClassName)}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
