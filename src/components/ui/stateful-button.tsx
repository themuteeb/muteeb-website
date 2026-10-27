import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleX, LoaderCircle, Send } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type StatefulButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatefulButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  status: StatefulButtonStatus;
  idleContent?: ReactNode;
  loadingContent?: ReactNode;
  successContent?: ReactNode;
  errorContent?: ReactNode;
}

export function StatefulButton({
  status,
  idleContent = 'Send message',
  loadingContent = 'Sending…',
  successContent = 'Sent successfully',
  errorContent = 'Could not complete — retry',
  className,
  disabled,
  ...props
}: StatefulButtonProps) {
  const content = {
    idle: <><Send className="h-4 w-4" />{idleContent}</>,
    loading: <><LoaderCircle className="h-4 w-4 animate-spin" />{loadingContent}</>,
    success: <><Check className="h-4 w-4" />{successContent}</>,
    error: <><CircleX className="h-4 w-4" />{errorContent}</>,
  }[status];

  return (
    <button
      {...props}
      disabled={disabled || status !== 'idle'}
      aria-live="polite"
      className={cn(
        'relative flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70',
        status === 'success' && 'bg-emerald-700',
        status === 'error' && 'bg-rose-800',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.14 }}
          className="inline-flex items-center justify-center gap-2"
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
