import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export type FormStatusType = 'success' | 'error' | 'warning';

export interface FormStatusMessage {
  type: FormStatusType;
  title: string;
  message?: string;
}

const styles: Record<FormStatusType, { box: string; icon: React.ElementType; role: 'status' | 'alert' }> = {
  success: {
    box: 'border-accent/50 bg-accent/10 text-accent',
    icon: CheckCircle2,
    role: 'status',
  },
  error: {
    box: 'border-red-500/60 bg-red-950/50 text-red-400',
    icon: XCircle,
    role: 'alert',
  },
  warning: {
    box: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
    icon: AlertTriangle,
    role: 'alert',
  },
};

/** Inline, in-form status message (replaces toasts for form feedback). */
export const FormStatus: React.FC<{ status: FormStatusMessage | null }> = ({ status }) => {
  if (!status) return null;
  const s = styles[status.type];
  const Icon = s.icon;
  return (
    <div
      role={s.role}
      aria-live={status.type === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${s.box}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">{status.title}</div>
        {status.message && (
          <div className="mt-1 font-sans text-xs leading-relaxed opacity-90">{status.message}</div>
        )}
      </div>
    </div>
  );
};
