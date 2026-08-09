import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemePreset } from '../types';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
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
  const [theme, setThemeState] = useState<ThemePreset>('neon');
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
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'toggle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(600, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'submit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio context may be restricted or unsupported
    }
  };

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    playSound('toggle');
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Style helper mapping for high contrast accents
  const getThemeClasses = () => {
    switch (theme) {
      case 'lime':
        return {
          accentClass: 'text-lime-400',
          bgAccentClass: 'bg-lime-400 text-black',
          borderAccentClass: 'border-lime-400',
          glowAccentClass: 'shadow-[0_0_20px_rgba(163,230,53,0.4)]',
          textAccentClass: 'text-lime-400',
        };
      case 'coral':
        return {
          accentClass: 'text-rose-500',
          bgAccentClass: 'bg-rose-500 text-white',
          borderAccentClass: 'border-rose-500',
          glowAccentClass: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
          textAccentClass: 'text-rose-500',
        };
      case 'violet':
        return {
          accentClass: 'text-purple-400',
          bgAccentClass: 'bg-purple-500 text-white',
          borderAccentClass: 'border-purple-400',
          glowAccentClass: 'shadow-[0_0_20px_rgba(192,132,252,0.4)]',
          textAccentClass: 'text-purple-400',
        };
      case 'mono':
        return {
          accentClass: 'text-white',
          bgAccentClass: 'bg-white text-black',
          borderAccentClass: 'border-white',
          glowAccentClass: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]',
          textAccentClass: 'text-white',
        };
      case 'neon':
      default:
        return {
          accentClass: 'text-cyan-400',
          bgAccentClass: 'bg-cyan-400 text-black',
          borderAccentClass: 'border-cyan-400',
          glowAccentClass: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
          textAccentClass: 'text-cyan-400',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      soundEnabled,
      toggleSound,
      playSound,
      ...themeClasses
    }}>
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
