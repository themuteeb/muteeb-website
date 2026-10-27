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
  textAccentClass: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** High-contrast accent presets tuned for light surfaces. */
const THEME_COLORS: Record<ThemePreset, { accent: string; bright: string; deep: string }> = {
  neon:   { accent: '#0e7490', bright: '#0891b2', deep: '#155e75' },
  lime:   { accent: '#4d7c0f', bright: '#65a30d', deep: '#365314' },
  coral:  { accent: '#be123c', bright: '#e11d48', deep: '#9f1239' },
  violet: { accent: '#6d28d9', bright: '#7c3aed', deep: '#5b21b6' },
  mono:   { accent: '#334155', bright: '#475569', deep: '#1e293b' },
};

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

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    playSound('toggle');
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // push accent colours into the design-system CSS variables so `text-accent` etc react
    const c = THEME_COLORS[theme];
    const root = document.documentElement;
    root.style.setProperty('--color-accent', c.accent);
    root.style.setProperty('--color-accent-bright', c.bright);
    root.style.setProperty('--color-accent-deep', c.deep);
  }, [theme]);

  const themeClasses = {
    accentClass: 'text-accent',
    bgAccentClass: 'bg-accent text-white',
    borderAccentClass: 'border-accent',
    textAccentClass: 'text-accent',
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
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

// Context hooks are intentionally exported alongside their provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
