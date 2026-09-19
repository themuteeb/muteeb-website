import React, { createContext, useContext, useState } from 'react';

/**
 * Theme + sound context for muteeb.in
 * The visual accent is now a fixed part of the design system (code green
 * #22d472 on a near-black canvas), so this context keeps the interface
 * audio engine and exposes the shared accent classes.
 */
interface ThemeContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type?: 'click' | 'toggle' | 'submit' | 'hover') => void;
  accentClass: string;
  bgAccentClass: string;
  borderAccentClass: string;
  glowAccentClass: string;
  textAccentClass: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio synthesizer using Web Audio API for high-tech micro clicks
  const playSound = (type: 'click' | 'toggle' | 'submit' | 'hover' = 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.03);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'toggle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(600, now + 0.04);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'submit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio context may be restricted or unsupported
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Fixed code-green accent classes, shared across the app
  const themeClasses = {
    accentClass: 'text-accent',
    bgAccentClass: 'bg-accent text-black',
    borderAccentClass: 'border-accent',
    glowAccentClass: 'shadow-[0_0_24px_rgba(34,212,114,0.35)]',
    textAccentClass: 'text-accent',
  };

  return (
    <ThemeContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playSound,
        ...themeClasses,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
