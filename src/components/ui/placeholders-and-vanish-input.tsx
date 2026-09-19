import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — PlaceholdersAndVanishInput
 * An input with rotating placeholders; on submit the current text
 * explodes into characters and vanishes.
 * https://ui.aceternity.com/components/placeholders-and-vanish-input
 */
export function PlaceholdersAndVanishInput({
  placeholders,
  value,
  onChange,
  onSubmit,
  className,
  type = 'text',
  submitLabel = 'Submit',
  autoFocus,
}: {
  placeholders: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  className?: string;
  type?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [vanishingChars, setVanishingChars] = useState<
    Array<{ char: string; x: number; y: number; rotate: number }>
  | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const startAnimation = () => {
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      }, 3200);
    };
    startAnimation();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [placeholders]);

  const triggerVanish = (text: string) => {
    setVanishingChars(
      text.split('').map((char) => ({
        char,
        x: (Math.random() - 0.5) * 180,
        y: -(Math.random() * 90 + 50),
        rotate: (Math.random() - 0.5) * 50,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitted = value;
    const textToVanish = submitted || placeholders[currentPlaceholder];
    if (!textToVanish.trim()) return;
    triggerVanish(textToVanish);
    onChange('');
    setTimeout(() => {
      setVanishingChars(null);
      onSubmit(submitted);
    }, 480);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex h-12 w-full items-center overflow-hidden rounded-full border border-line bg-surface font-mono text-sm text-ink transition-[border-color,box-shadow] duration-300 focus-within:border-accent/60 focus-within:shadow-[0_0_28px_rgba(34,212,114,0.18)] hover:border-line-2',
        className
      )}
    >
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="relative z-20 h-full w-full bg-transparent pl-5 pr-16 text-ink outline-none placeholder:text-transparent"
        aria-label={placeholders[0]}
      />

      {/* rotating placeholder */}
      {value === '' && !vanishingChars && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center pl-5">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPlaceholder}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="truncate text-sm text-ink-3"
            >
              {placeholders[currentPlaceholder]}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      {/* vanishing characters */}
      {vanishingChars && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center pl-5">
          {vanishingChars.map((c, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: c.x,
                y: c.y,
                rotate: c.rotate,
                scale: 0.4,
              }}
              transition={{ duration: 0.45, ease: 'easeIn' }}
              className="inline-block whitespace-pre text-sm text-accent"
            >
              {c.char}
            </motion.span>
          ))}
        </div>
      )}

      <button
        type="submit"
        aria-label={submitLabel}
        className="absolute right-1.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,212,114,0.55)] active:scale-95"
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          height="1em"
          width="1em"
          className="h-4 w-4 -translate-y-px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19V5m0 0l-6 6m6-6l6 6"
          />
        </svg>
      </button>
    </form>
  );
}
