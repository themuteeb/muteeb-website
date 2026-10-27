import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToasterType = 'success' | 'error' | 'warning';

interface ToasterProps {
  show: boolean;
  type?: ToasterType;
  title: string;
  message?: string;
  duration?: number;
  inline?: boolean;
  onClose: () => void;
}

export const Toaster: React.FC<ToasterProps> = ({
  show,
  type = 'success',
  title,
  message,
  duration = 4000,
  inline = false,
  onClose,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  const config = {
    success: { icon: CheckCircle2 },
    error: { icon: XCircle },
    warning: { icon: AlertTriangle },
  };

  const c = config[type];
  const Icon = c.icon;
  const containerClass = inline
    ? 'animate-slideInRight pointer-events-auto w-full'
    : 'animate-slideInRight pointer-events-auto fixed right-3 top-20 z-[100] w-[calc(100vw-1.5rem)] max-w-[280px] sm:right-6 sm:top-24 sm:w-96 sm:max-w-sm';

  return (
    <div
      className={containerClass}
      role={type === 'success' ? 'status' : 'alert'}
      aria-live={type === 'success' ? 'polite' : 'assertive'}
    >
      <div
        className="liquid-glass relative overflow-hidden rounded-2xl border border-accent/70 p-4"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
              {title}
            </div>
            {message && (
              <div className="mt-1 font-sans text-xs leading-relaxed text-ink-3">
                {message}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          className="animate-progressBar absolute bottom-0 left-0 h-0.5 bg-accent"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};
