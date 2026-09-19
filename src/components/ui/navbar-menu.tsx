import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavbarMenuItem {
  label: string;
  desc?: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Aceternity UI — NavbarMenu
 * A smooth, spring-driven dropdown menu for floating navbars.
 * https://ui.aceternity.com/components/navbar-menu
 */
export const NavbarMenu = ({
  label,
  items,
  className,
  panelClassName,
  onItemClick,
}: {
  label: string;
  items: NavbarMenuItem[];
  className?: string;
  panelClassName?: string;
  onItemClick?: (item: NavbarMenuItem) => void;
}) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const closeMenu = (delay = 120) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={openMenu}
      onMouseLeave={() => closeMenu()}
    >
      <button
        type="button"
        onClick={() => (open ? closeMenu(0) : openMenu())}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'group flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
          open
            ? 'bg-accent/10 text-accent'
            : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
        )}
      >
        {label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="inline-flex"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(4px)' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
            }}
            role="menu"
            className={cn(
              'absolute left-1/2 top-[calc(100%+10px)] z-50 w-72 -translate-x-1/2 rounded-2xl border border-line bg-surface/95 p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl',
              panelClassName
            )}
          >
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * idx, duration: 0.2 }}
                  onClick={() => {
                    onItemClick?.(item);
                    item.onClick?.();
                    closeMenu(0);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors',
                    item.active
                      ? 'bg-accent/10'
                      : 'hover:bg-surface-2'
                  )}
                >
                  {Icon && (
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                        item.active
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-line bg-canvas text-ink-2'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block font-mono text-[11px] font-bold uppercase tracking-[0.14em]',
                        item.active ? 'text-accent' : 'text-ink'
                      )}
                    >
                      {item.label}
                    </span>
                    {item.desc && (
                      <span className="mt-0.5 block text-xs leading-snug text-ink-3">
                        {item.desc}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
