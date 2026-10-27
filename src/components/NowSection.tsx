import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { Coffee, Heart, Languages, Moon, Music, Sparkles, Star, Zap } from 'lucide-react';

interface NowSectionProps {
  profile: Profile | null;
}

const factIconList = [Coffee, Music, Languages, Moon, Sparkles, Star, Zap, Heart];

export const NowSection: React.FC<NowSectionProps> = ({ profile }) => {
  const { playSound } = useTheme();
  const quickFacts = (profile?.quick_facts || []).map((text, idx) => ({
    icon: factIconList[idx % factIconList.length],
    text,
  }));

  if (quickFacts.length === 0) return null;

  return (
    <section id="now" className="border-b border-line bg-surface/40 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
            {'// personal trivia'}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Quick <span className="text-accent">facts</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickFacts.map((fact, idx) => {
            const Icon = fact.icon;
            return (
              <motion.div
                key={`${fact.text}-${idx}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, delay: (idx % 4) * 0.05 }}
                onMouseEnter={() => playSound('hover')}
                className="group flex items-center gap-3 rounded-xl liquid-glass p-3.5 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Icon className="h-4 w-4 shrink-0 text-accent" />
                <span className="font-mono text-[10px] font-semibold uppercase leading-snug tracking-wide text-ink-2">
                  {fact.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
