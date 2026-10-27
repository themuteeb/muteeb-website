import React from 'react';
import { Skill } from '../types';

interface TechMatrixProps {
  skills: Skill[];
}

export const TechMatrix: React.FC<TechMatrixProps> = ({ skills }) => (
  <section id="stack" className="relative border-b border-line bg-canvas py-12 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
          {'// languages & tools'}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Tools <span className="text-accent">I use</span>
        </h2>
      </div>

      {skills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center font-mono text-sm text-ink-3">
          no tools added yet.
        </div>
      ) : (
        <div className="liquid-glass rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id || skill.name}
                title={skill.category ? `${skill.category} · ${skill.level}%` : skill.name}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs font-medium text-ink-2 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);
