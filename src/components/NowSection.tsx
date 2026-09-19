import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import {
  BookOpen,
  Code,
  Coffee,
  Compass,
  Heart,
  Languages,
  Lightbulb,
  Moon,
  Music,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

interface NowSectionProps {
  profile: Profile | null;
}

const nowIconMap: Record<string, React.ElementType> = {
  LEARNING: BookOpen,
  BUILDING: Code,
  READING: Compass,
  THINKING: Lightbulb,
  WORKING: Zap,
  EXPLORING: Compass,
  CREATING: Sparkles,
};

const factIconList = [Coffee, Music, Languages, Moon, Sparkles, Star, Zap, Heart];

export const NowSection: React.FC<NowSectionProps> = ({ profile }) => {
  const { playSound } = useTheme();

  const nowFocusData = profile?.now_focus || [];
  const quickFactsData = profile?.quick_facts || [];

  const nowFocus = nowFocusData.map((item, idx) => ({
    title: item.title,
    icon: nowIconMap[item.title.toUpperCase()] || [BookOpen, Code, Compass, Lightbulb][idx % 4],
    desc: item.desc,
  }));

  const quickFacts = quickFactsData.map((text, idx) => ({
    icon: factIconList[idx % factIconList.length],
    text,
  }));

  if (nowFocus.length === 0 && quickFacts.length === 0) return null;

  return (
    <section id="now" className="border-b border-line bg-surface/40 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        {nowFocus.length > 0 && (
          <div>
            <div className="mb-10">
              <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                {'// current focus'}
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                What I&apos;m{' '}
                <span className="text-glow-accent text-accent">up to now</span>
              </h2>
              <p className="mt-4 max-w-lg font-mono text-xs uppercase tracking-wider text-ink-3">
                where my time and energy are going these days
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {nowFocus.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: (idx % 2) * 0.1 }}
                    className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-2"
                  >
                    <div className="relative flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(34,212,114,0.35)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-mono text-base font-bold uppercase tracking-[0.14em] text-ink">
                        {item.title}
                      </h3>
                    </div>
                    <p className="relative mt-4 font-sans text-sm leading-relaxed text-ink-3">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {quickFacts.length > 0 && (
          <div className={nowFocus.length > 0 ? 'border-t border-line pt-14' : ''}>
            <div className="mb-8">
              <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                {'// personal trivia'}
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Quick <span className="text-accent">facts</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickFacts.map((fact, idx) => {
                const Icon = fact.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: (idx % 4) * 0.07 }}
                    onMouseEnter={() => playSound('hover')}
                    className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_24px_rgba(34,212,114,0.12)]"
                  >
                    <Icon className="relative h-5 w-5 shrink-0 text-accent" />
                    <span className="relative font-mono text-[11px] font-semibold uppercase leading-snug tracking-wide text-ink-2">
                      {fact.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
