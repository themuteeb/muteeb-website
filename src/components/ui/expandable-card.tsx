import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ExpandableCardProps {
  children: ReactNode;
  expandedContent: ReactNode;
  className?: string;
  actionLabel?: string;
  collapseLabel?: string;
  onToggle?: (expanded: boolean) => void;
}

/** Card that reveals its longer-form content inline with a smooth layout animation. */
export function ExpandableCard({
  children,
  expandedContent,
  className,
  actionLabel = 'view details',
  collapseLabel = 'show less',
  onToggle,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 0.32;

  return (
    <motion.article
      layout
      className={cn('relative', className)}
      transition={{ layout: { duration, ease: [0.22, 1, 0.36, 1] } }}
    >
      {children}

      <motion.button
        layout
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => {
          const nextExpanded = !expanded;
          setExpanded(nextExpanded);
          onToggle?.(nextExpanded);
        }}
        className="flex w-full items-center justify-between border-t border-line px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-white/[0.025]"
      >
        <span>{expanded ? collapseLabel : actionLabel}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={contentId}
            key="expanded-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 py-5 text-sm leading-relaxed text-ink-2">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
