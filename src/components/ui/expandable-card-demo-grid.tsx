import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ExpandableCardGridItem {
  id: string;
  title: string;
  preview: ReactNode;
  expandedContent: ReactNode;
}

interface ExpandableCardDemoGridProps {
  items: ExpandableCardGridItem[];
  label?: string;
}

/** Laptop/desktop modal-expandable card grid inspired by Aceternity's demo. */
export function ExpandableCardDemoGrid({
  items,
  label = 'Projects',
}: ExpandableCardDemoGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (activeId === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeId]);

  const duration = reducedMotion ? 0 : 0.28;

  return (
    <>
      <div
        role="region"
        aria-label={`${label} expandable card grid`}
        className="hidden grid-cols-1 gap-5 lg:grid lg:grid-cols-2 xl:grid-cols-3"
      >
        {items.map((item) => (
          <motion.article
            key={item.id}
            layoutId={`expandable-project-${item.id}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-2xl liquid-glass transition-colors duration-300"
            transition={{ layout: { duration, ease: [0.22, 1, 0.36, 1] } }}
          >
            <div className="flex-1">{item.preview}</div>
            <button
              type="button"
              onClick={() => setActiveId(item.id)}
              aria-label={`Expand ${item.title}`}
              className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-white/[0.025]"
            >
              <span>view project details</span>
              <span aria-hidden="true" className="text-base leading-none">↗</span>
            </button>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            key="project-card-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            onClick={() => setActiveId(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
          >
            <motion.article
              layoutId={`expandable-project-${activeItem.id}`}
              role="dialog"
              aria-modal="true"
              aria-label={`${activeItem.title} project details`}
              onClick={(event) => event.stopPropagation()}
              transition={{ layout: { duration, ease: [0.22, 1, 0.36, 1] } }}
              className="relative max-h-[min(90vh,900px)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-line bg-canvas shadow-2xl shadow-black/40"
            >
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Close project details"
                className="sticky right-4 top-4 z-10 ml-auto mr-4 mt-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas/90 text-ink-2 backdrop-blur transition-colors hover:border-accent/60 hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="-mt-9">
                {activeItem.preview}
                <div className="border-t border-line px-5 py-6 text-sm leading-relaxed text-ink-2 sm:px-8 sm:py-8">
                  {activeItem.expandedContent}
                </div>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
