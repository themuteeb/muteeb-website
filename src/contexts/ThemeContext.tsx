import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemePreset } from '../types';
import { SITE_SETTINGS_CACHE_KEY } from '../lib/siteSettings';

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
  applySiteDefaultTheme: (theme: ThemePreset) => void;
  applySiteAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'muteeb-accent-theme';

/** High-contrast accent presets tuned for light surfaces. */
const THEME_COLORS: Record<ThemePreset, { accent: string; bright: string; deep: string; foreground: string }> = {
  neon:   { accent: '#0e7490', bright: '#0891b2', deep: '#155e75', foreground: '#ffffff' },
  white:  { accent: '#f4f4f5', bright: '#ffffff', deep: '#d4d4d8', foreground: '#09090b' },
  pink:   { accent: '#db2777', bright: '#ec4899', deep: '#be185d', foreground: '#ffffff' },
  violet: { accent: '#6d28d9', bright: '#7c3aed', deep: '#5b21b6', foreground: '#ffffff' },
  mono:   { accent: '#334155', bright: '#475569', deep: '#1e293b', foreground: '#ffffff' },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    if (typeof window === 'undefined') return 'neon';
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'lime') return 'white';
      if (savedTheme === 'coral') return 'pink';
      if (savedTheme && Object.prototype.hasOwnProperty.call(THEME_COLORS, savedTheme)) {
        return savedTheme as ThemePreset;
      }
      // No visitor choice yet: use the palette the owner set for the site (cached).
      const cachedSite = JSON.parse(window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY) || 'null') as { palette?: unknown } | null;
      return cachedSite && typeof cachedSite.palette === 'string' && Object.prototype.hasOwnProperty.call(THEME_COLORS, cachedSite.palette)
        ? (cachedSite.palette as ThemePreset)
        : 'neon';
    } catch {
      return 'neon';
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // Owner's custom accent (#rrggbb). Empty string means no override.
  const [siteAccent, setSiteAccent] = useState<string>(() => {
    try {
      const cached = JSON.parse(window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY) || 'null') as { accentHex?: unknown } | null;
      return typeof cached?.accentHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(cached.accentHex) ? cached.accentHex : '';
    } catch {
      return '';
    }
  });

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
    try {
      // Only an explicit visitor choice is remembered.
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // The current tab still gets the selected accent when storage is unavailable.
    }
    playSound('toggle');
  };

  // Owner's site-wide palette: applies silently, and only while the visitor has not chosen one.
  const applySiteDefaultTheme = (siteTheme: ThemePreset) => {
    let hasVisitorChoice = false;
    try {
      hasVisitorChoice = Boolean(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      hasVisitorChoice = false;
    }
    if (!hasVisitorChoice && Object.prototype.hasOwnProperty.call(THEME_COLORS, siteTheme)) {
      setThemeState(siteTheme);
    }
  };

  const applySiteAccent = (hex: string) => {
    setSiteAccent(/^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : '');
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // push accent colours into the design-system CSS variables so `text-accent` etc react
    const root = document.documentElement;
    if (siteAccent) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(siteAccent.slice(i, i + 2), 16));
      const shade = (v: number, f: number) => Math.round(v * f).toString(16).padStart(2, '0');
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      root.style.setProperty('--color-accent', siteAccent);
      root.style.setProperty('--color-accent-bright', siteAccent);
      root.style.setProperty('--color-accent-deep', `#${shade(r, 0.75)}${shade(g, 0.75)}${shade(b, 0.75)}`);
      root.style.setProperty('--color-accent-foreground', luminance > 0.6 ? '#09090b' : '#ffffff');
    } else {
      const c = THEME_COLORS[theme];
      root.style.setProperty('--color-accent', c.accent);
      root.style.setProperty('--color-accent-bright', c.bright);
      root.style.setProperty('--color-accent-deep', c.deep);
      root.style.setProperty('--color-accent-foreground', c.foreground);
    }
  }, [theme, siteAccent]);

  const themeClasses = {
    accentClass: 'text-accent',
    bgAccentClass: 'bg-accent text-accent-foreground',
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
        applySiteDefaultTheme,
        applySiteAccent,
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
