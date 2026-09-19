import React from 'react';
import { motion } from 'framer-motion';
import { GridBackground } from './ui/grid-background';
import { LoaderTwo } from './ui/loader';

/**
 * Boot / loading experience for muteeb.in —
 * simple logo + domain with an Aceternity loader.
 */
export const BootSplash = ({ show }: { show: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas"
      aria-hidden={!show}
    >
      <GridBackground cellSize={36} glow={false} maskFrom="center" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
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
          <span className="text-accent">$</span> muteeb.in
        </div>

        {/* loader */}
        <div className="mt-6 flex justify-center">
          <LoaderTwo />
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          personal website of baba muteeb
        </div>
      </motion.div>
    </motion.div>
  );
};
