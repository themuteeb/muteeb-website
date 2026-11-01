import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatedModal } from './animated-modal';

// Site-styled replacement for the browser's alert() and confirm() popups.
interface DialogRequest {
  kind: 'alert' | 'confirm';
  message: string;
  resolve: (value: boolean) => void;
}

interface ThemedDialogApi {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
}

const ThemedDialogContext = createContext<ThemedDialogApi | null>(null);

export function ThemedDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const alert = useCallback(
    (message: string) =>
      new Promise<void>((resolve) => {
        setRequest({ kind: 'alert', message, resolve: () => resolve() });
      }),
    [],
  );

  const confirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        setRequest({ kind: 'confirm', message, resolve });
      }),
    [],
  );

  const close = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  return (
    <ThemedDialogContext.Provider value={{ alert, confirm }}>
      {children}
      <AnimatedModal open={request !== null} onClose={() => close(false)} labelledBy="themed-dialog-title">
        <div className="space-y-5 text-center font-mono">
          <div id="themed-dialog-title" className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
            {request?.kind === 'confirm' ? '// confirm' : '// notice'}
          </div>
          <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-ink-2">{request?.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {request?.kind === 'confirm' && (
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-full border border-line bg-black/40 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:text-accent"
              >
                cancel
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => close(true)}
              className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              {request?.kind === 'confirm' ? 'confirm' : 'ok'}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </ThemedDialogContext.Provider>
  );
}

// Context hooks are intentionally exported alongside their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useThemedDialog(): ThemedDialogApi {
  const api = useContext(ThemedDialogContext);
  if (!api) throw new Error('useThemedDialog must be used within ThemedDialogProvider');
  return api;
}
