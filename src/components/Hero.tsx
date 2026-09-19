import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { ArrowDown, Github, Instagram, MapPin, Sparkles } from 'lucide-react';
import { FlipWords } from './ui/flip-words';
import { CanvasText } from './ui/canvas-text';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { GridBackground } from './ui/grid-background';

// helper to treat "nil" / "null" strings as missing
const clean = (v: string | undefined | null, fallback: string) => {
  if (!v) return fallback;
  const s = v.trim().toLowerCase();
  if (s === 'nil' || s === 'null' || s === 'undefined' || s === 'n/a' || s === '-') return fallback;
  return v;
};

/* CanvasText palette for the hero name — site accent greens + terminal hues */
const HERO_NAME_COLORS = [
  '#22d472',
  '#7cf5ac',
  '#6ee7ff',
  '#4ecdc4',
  '#a3e635',
  '#f5c97b',
];

interface HeroProps {
  profile: Profile | null;
  onOpenContact: () => void;
}

/* ------------------------------------------------------------------ */
/*  muteeb.ts — floating terminal code block                            */
/* ------------------------------------------------------------------ */

type Token = { text: string; cls?: string };

function useCodeTokens(profile: Profile | null): Token[] {
  return useMemo<Token[]>(() => {
    const name = clean(profile?.full_name, 'Baba Muteeb');
    const loc = clean(profile?.location, 'Srinagar, Kashmir');
    const focus = clean(profile?.typewriter_roles?.[0], 'clean web applications');
    return [
      { text: '// muteeb.ts\n', cls: 'text-ink-3/80 italic' },
      { text: 'type', cls: 'text-accent font-semibold' },
      { text: ' ' },
      { text: 'Stack', cls: 'text-[#6ee7ff]' },
      { text: ' = ' },
      { text: "'TypeScript'", cls: 'text-[#f5c97b]' },
      { text: ' | ' },
      { text: "'React'", cls: 'text-[#f5c97b]' },
      { text: ' | ' },
      { text: "'Supabase'", cls: 'text-[#f5c97b]' },
      { text: ';\n\n' },
      { text: 'interface', cls: 'text-accent font-semibold' },
      { text: ' ' },
      { text: 'Developer', cls: 'text-[#6ee7ff]' },
      { text: ' {\n' },
      { text: '  name' },
      { text: ': ' },
      { text: 'string', cls: 'text-[#6ee7ff]' },
      { text: ';\n' },
      { text: '  location' },
      { text: ': ' },
      { text: 'string', cls: 'text-[#6ee7ff]' },
      { text: ';\n' },
      { text: '  stack' },
      { text: ': ' },
      { text: 'Stack', cls: 'text-[#6ee7ff]' },
      { text: '[];\n' },
      { text: '  focus' },
      { text: ': ' },
      { text: 'string', cls: 'text-[#6ee7ff]' },
      { text: ';\n' },
      { text: '  openToWork' },
      { text: ': ' },
      { text: 'boolean', cls: 'text-[#6ee7ff]' },
      { text: ';\n' },
      { text: '}\n\n' },
      { text: 'const', cls: 'text-accent font-semibold' },
      { text: ' muteeb: ' },
      { text: 'Developer', cls: 'text-[#6ee7ff]' },
      { text: ' = {\n' },
      { text: '  name' },
      { text: ': ' },
      { text: `'${name}'`, cls: 'text-[#f5c97b]' },
      { text: ',\n' },
      { text: '  location' },
      { text: ': ' },
      { text: `'${loc}'`, cls: 'text-[#f5c97b]' },
      { text: ',\n' },
      { text: '  stack' },
      { text: ': [' },
      { text: "'TypeScript'", cls: 'text-[#f5c97b]' },
      { text: ', ' },
      { text: "'React'", cls: 'text-[#f5c97b]' },
      { text: ', ' },
      { text: "'Supabase'", cls: 'text-[#f5c97b]' },
      { text: '],\n' },
      { text: '  focus' },
      { text: ': ' },
      { text: `'${focus.toLowerCase()}'`, cls: 'text-[#f5c97b]' },
      { text: ',\n' },
      { text: '  openToWork' },
      { text: ': ' },
      { text: 'true', cls: 'text-[#6ee7ff]' },
      { text: ',\n' },
      { text: '};\n\n' },
      { text: 'export default', cls: 'text-accent font-semibold' },
      { text: ' muteeb;\n' },
    ];
  }, [profile]);
}

const HeroTerminal = ({ profile }: { profile: Profile | null }) => {
  const tokens = useCodeTokens(profile);
  const totalChars = useMemo(
    () => tokens.reduce((sum, t) => sum + t.text.length, 0),
    [tokens]
  );
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 2;
      if (current >= totalChars) {
        current = totalChars;
        clearInterval(timer);
      }
      setCharCount(current);
    }, 28);
    return () => clearInterval(timer);
  }, [totalChars]);

  const renderCode = () => {
    let remaining = charCount;
    const out: React.ReactNode[] = [];
    tokens.forEach((token, i) => {
      if (remaining <= 0) return;
      const text = token.text.slice(0, remaining);
      remaining -= token.text.length;
      out.push(
        <span key={i} className={token.cls}>
          {text}
        </span>
      );
    });
    return out;
  };

  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-full"
    >
      {/* glow behind terminal */}
      <div className="absolute -inset-6 rounded-[2rem] bg-accent/[0.06] blur-3xl" />

      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm">
        {/* terminal chrome */}
        <div className="flex items-center justify-between border-b border-line bg-surface-2/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span className="text-accent">~/muteeb.in</span>
            <span className="text-ink-3/60">·</span>
            <span>muteeb.ts</span>
          </div>
          <div className="w-[52px]" aria-hidden="true" />
        </div>

        {/* code body */}
        <div className="relative min-h-[340px] overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] sm:min-h-[360px] sm:text-[13px]">
          <pre className="whitespace-pre text-ink-2">{renderCode()}
            <span className="ml-0.5 inline-block h-[1.1em] w-[7px] translate-y-[3px] animate-blink bg-accent" />
          </pre>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

export const Hero: React.FC<HeroProps> = ({ profile, onOpenContact }) => {
  const { playSound } = useTheme();

  const defaultRoles = [
    'clean web applications',
    'modern user interfaces',
    'developer tools',
  ];
  const roles =
    profile?.typewriter_roles && profile.typewriter_roles.length > 0
      ? profile.typewriter_roles.map((r) => r.toLowerCase())
      : defaultRoles;

  const scrollToWork = () => {
    playSound('click');
    const elem = document.querySelector('#work');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col justify-start overflow-hidden border-b border-line bg-canvas pb-12 pt-12 sm:pt-14"
    >
      <GridBackground cellSize={44} maskFrom="top" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* left column — words */}
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-ink-3"
            >
              hey, i&apos;m
            </motion.p>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="-mt-1 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl"
            >
              <CanvasText
                text={clean(profile?.full_name, 'Baba Muteeb')}
                className="tracking-normal"
                backgroundClassName="bg-canvas"
                colors={HERO_NAME_COLORS}
                lineGap={6}
                animationDuration={10}
              />
              .
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 flex flex-wrap items-baseline gap-x-2 text-xl font-semibold text-ink-2 sm:text-2xl"
            >
              <span>I build</span>
              <FlipWords
                words={roles}
                className="font-mono text-lg font-bold text-accent sm:text-xl"
              />
              <span>for the web.</span>
            </motion.div>

            <TextGenerateEffect
              words={
                profile?.title ||
                'Full-stack developer building clean, fast web applications with TypeScript, React, and Supabase.'
              }
              delay={0.55}
              className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-3 sm:text-base"
            />

            {profile?.headline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.8 }}
                className="mt-5 max-w-xl border-l-2 border-accent/50 pl-4 text-sm italic leading-relaxed text-ink-3"
              >
                {profile.headline}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={scrollToWork}
                className="group flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(34,212,114,0.5)] active:translate-y-0"
              >
                <span>see my work</span>
                <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>

              <button
                onClick={() => {
                  playSound('submit');
                  onOpenContact();
                }}
                className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-2 transition-all duration-300 hover:border-accent/50 hover:text-accent hover:shadow-[0_0_24px_rgba(34,212,114,0.18)]"
              >
                <Sparkles className="h-4 w-4" />
                <span>say hi</span>
              </button>

              <div className="flex items-center gap-2">
                {profile?.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound('click')}
                    title={`Instagram ${profile.instagram_handle}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-3 transition-all duration-300 hover:border-accent/50 hover:text-accent"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {profile?.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound('click')}
                    title="GitHub"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-3 transition-all duration-300 hover:border-accent/50 hover:text-accent"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {profile?.available_for_work && (
                  <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                    <MapPin className="h-3 w-3" />
                    open to collab
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* right column — floating terminal */}
          <motion.div
            initial={{ opacity: 0, rotate: 1.5 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none"
          >
            <HeroTerminal profile={profile} />
          </motion.div>
        </div>
      </div>


    </section>
  );
};
