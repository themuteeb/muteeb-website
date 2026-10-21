import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-=?';

interface EncryptedTextProps {
  text: string;
  className?: string;
  /** Time between each reveal step, in milliseconds. */
  interval?: number;
}

/**
 * Encrypted Text — a brief terminal-like scramble that resolves into the text.
 * The complete value remains available to assistive technology throughout.
 */
export function EncryptedText({
  text,
  className,
  interval = 48,
}: EncryptedTextProps) {
  const [revealed, setRevealed] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      setFrame(ticks);
      if (ticks % 2 === 0) {
        setRevealed((count) => {
          const next = count + 1;
          if (next >= text.length) window.clearInterval(timer);
          return Math.min(next, text.length);
        });
      }
      if (ticks >= text.length * 2) window.clearInterval(timer);
    }, interval);

    return () => window.clearInterval(timer);
  }, [text, interval]);

  return (
    <span className={cn('relative inline-block whitespace-pre-wrap', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => {
          if (character === ' ' || index < revealed) {
            return <span key={`${index}-${character}`}>{character}</span>;
          }

          const glyphIndex = (index * 17 + frame * 13 + text.length) % GLYPHS.length;
          return (
            <span
              key={`${index}-${character}`}
              className="text-accent text-glow-accent"
            >
              {GLYPHS[glyphIndex]}
            </span>
          );
        })}
      </span>
    </span>
  );
}
