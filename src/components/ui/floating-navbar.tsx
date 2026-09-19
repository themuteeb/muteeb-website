import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — FloatingNavbar
 * A navbar that floats in once you scroll past the hero and hides again
 * near the top of the page.
 * https://ui.aceternity.com/components/floating-navbar
 */
export const FloatingNavbar = ({
  children,
  className,
  appearAfter = 80,
}: {
  children?: React.ReactNode;
  className?: string;
  appearAfter?: number;
}) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, 'change', (current) => {
    if (current > appearAfter) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: -24,
            scale: 0.96,
          }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -24,
            scale: 0.96,
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 30,
          }}
          className={cn(
            'fixed inset-x-0 top-4 z-50 flex justify-center px-4',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
