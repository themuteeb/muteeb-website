import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — PointerHighlight
 * A rectangle that trails the pointer behind the highlighted content,
 * springs back to center on leave.
 * https://ui.aceternity.com/components/pointer-highlight
 */
export const PointerHighlight = ({
  children,
  className,
  containerClassName,
  rectangleClassName,
  rectangleSize = { width: '110%', height: '1.25em' },
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  rectangleClassName?: string;
  rectangleSize?: { width?: string; height?: string };
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 180, damping: 22, mass: 0.6 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // spring the highlight back to the middle of the content
    x.set(rect.width / 2);
    y.set(rect.height / 2);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('relative', containerClassName)}
    >
      <motion.div
        style={{ x: xSpring, y: ySpring }}
        className="pointer-events-none absolute left-0 top-0 z-0"
        aria-hidden
      >
        <motion.div
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0.55,
            scale: isHovered ? 1 : 0.88,
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            '-translate-x-1/2 -translate-y-1/2 rounded-[0.4em] border border-accent/50 bg-accent/15 backdrop-blur-[2px]',
            rectangleClassName
          )}
          style={rectangleSize}
        />
      </motion.div>
      <div className={cn('relative z-[1]', className)}>{children}</div>
    </div>
  );
};
