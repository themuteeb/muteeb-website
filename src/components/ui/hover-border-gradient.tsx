import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — HoverBorderGradient.
 * A button whose border glows where the cursor is, with a moving gradient.
 * https://ui.aceternity.com/components/hover-border-gradient
 */
export const HoverBorderGradient = ({
  children,
  containerClassName,
  className,
  duration = 1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  as: _as,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string;
  duration?: number;
  /** Accepted for compatibility with the Aceternity demo; always renders a button. */
  as?: 'button';
}) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handleMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className={cn('relative inline-flex overflow-hidden p-px', containerClassName)}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, var(--color-accent-bright) 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0.35,
        }}
        transition={{ duration }}
      />
      <button
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMove}
        className={cn('relative z-10 inline-flex items-center justify-center', className)}
        {...props}
      >
        {children}
      </button>
    </div>
  );
};

/**
 * Same glowing border, but a plain <div> frame. Use it around a component that
 * already renders its own <button> (e.g. StatefulButton), so buttons are never nested.
 */
export const HoverBorderFrame = ({
  children,
  containerClassName,
  duration = 1,
}: {
  children: React.ReactNode;
  containerClassName?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMove}
      className={cn('relative inline-flex overflow-hidden rounded-full p-px', containerClassName)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, var(--color-accent-bright) 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0.35,
        }}
        transition={{ duration }}
      />
      <div className="relative z-10 flex w-full">{children}</div>
    </div>
  );
};
