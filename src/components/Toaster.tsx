import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToasterType = 'success' | 'error' | 'warning';

interface ToasterProps {
  show: boolean;
  type?: ToasterType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export const Toaster: React.FC<ToasterProps> = ({
  show,
  type = 'success',
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-950',
      iconColor: 'text-emerald-400',
      progressBar: 'bg-emerald-500',
    },
    error: {
      icon: XCircle,
      borderColor: 'border-rose-500',
      bgColor: 'bg-rose-950',
      iconColor: 'text-rose-400',
      progressBar: 'bg-rose-500',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-950',
      iconColor: 'text-amber-400',
      progressBar: 'bg-amber-500',
    },
  };

  const c = config[type];
  const Icon = c.icon;

  return (
    <div className="fixed top-20 sm:top-24 right-3 sm:right-6 z-[100] animate-slideInRight pointer-events-auto w-[calc(100vw-1.5rem)] max-w-[280px] sm:max-w-sm sm:w-96">
      <div className={`${c.bgColor} border-2 ${c.borderColor} shadow-2xl font-mono overflow-hidden`}>
        <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.iconColor} shrink-0 mt-0.5`} />

          <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider break-words">
              {title}
            </h4>
            {message && (
              <p className="text-[9px] sm:text-[11px] text-zinc-300 leading-relaxed break-words">
                {message}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors shrink-0 -mt-0.5"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-black/50 relative overflow-hidden">
          <div
            className={`h-full ${c.progressBar} animate-progressBar`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
};
