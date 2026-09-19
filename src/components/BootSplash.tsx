import React from 'react';
import { motion } from 'framer-motion';
import { LayoutTextFlip } from './ui/layout-text-flip';
import { GridBackground } from './ui/grid-background';

/**
 * Boot / loading experience for muteeb.in —
 * Aceternity LayoutTextFlip cycling boot words over a grid.
 */
export const BootSplash = ({ show }: { show: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas"
      aria-hidden={!show}
    >
      <GridBackground cellSize={36} glow={false} maskFrom="center" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center"
      >
        <div className="relative">
          <div className="absolute -inset-3 rounded-2xl bg-accent/15 blur-xl" />
          <img
            src="/images/logo.png"
            alt=""
            className="relative h-16 w-16 rounded-2xl border border-line object-cover"
          />
        </div>

        <div className="mt-8 font-mono text-sm text-ink-2">
          <span className="text-accent">$</span>{' '}
          <LayoutTextFlip
            words={[
              'waking the database…',
              'compiling the ui…',
              'brewing chai…',
              'muteeb.in',
            ]}
            interval={780}
            className="inline-block min-h-[1.4em]"
            textClassName="text-ink-2"
          />
        </div>

        {/* progress line */}
        <div className="mt-6 h-[3px] w-44 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: '4%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.6, ease: [0.3, 0.6, 0.3, 1] }}
            className="h-full rounded-full bg-accent shadow-[0_0_14px_rgba(34,212,114,0.7)]"
          />
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          personal website of baba muteeb
        </div>
      </motion.div>
    </motion.div>
  );
};
