import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Skill } from '../types';
import { Code2 } from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface TechMatrixProps {
  skills: Skill[];
}

interface TechMatrixProps {
  skills: Skill[];
}

export const TechMatrix: React.FC<TechMatrixProps> = ({ skills }) => {
  const { playSound } = useTheme();

  return (
    <section id="stack" className="relative border-b border-line bg-canvas py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            {'// tools & languages'}
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Things <span className="text-glow-accent text-accent">I use</span>
          </h2>
          <TextGenerateEffect
            words="The daily drivers — plus a few things I keep around just because I like them."
            className="mt-4 max-w-lg text-sm leading-relaxed text-ink-3"
            stagger={0.04}
          />
        </div>

        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center font-mono text-sm text-ink-3">
            no tools added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill, idx) => (
              <motion.div
                key={skill.id || skill.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (idx % 3) * 0.08 }}
                onMouseEnter={() => playSound('hover')}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-2"
              >
                <GlowingEffect spread={26} borderRadius={16} />

                <div className="relative mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ink-3">
                      tool
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-accent">
                    {skill.level}%
                  </span>
                </div>

                <div className="relative mb-5 font-mono text-lg font-bold uppercase tracking-wide text-ink transition-colors group-hover:text-accent">
                  {skill.name}
                </div>

                <div className="relative">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-accent-deep via-accent to-accent-bright shadow-[0_0_12px_rgba(34,212,114,0.55)]"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

type SkillPropsAlias = { skills: Skill[] };
