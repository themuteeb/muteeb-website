import React from 'react';
import { Skill } from '../types';
import { Code2 } from 'lucide-react';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface TechMatrixProps {
  skills: Skill[];
}

export const TechMatrix: React.FC<TechMatrixProps> = ({ skills }) => {
  const skillGroups = skills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.category?.trim() || 'Tools';
    (groups[category] ||= []).push(skill);
    return groups;
  }, {});

  return (
    <section id="stack" className="relative border-b border-line bg-canvas py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
            {'// complete toolkit'}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tools <span className="text-accent">I use</span>
          </h2>
          <TextGenerateEffect
            words="Languages, frameworks, and everyday tools gathered together in one place."
            className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-3"
            stagger={0.04}
          />
        </div>

        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center font-mono text-sm text-ink-3">
            no tools added yet.
          </div>
        ) : (
          <div className="liquid-glass overflow-hidden rounded-2xl p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink">
                  all tools in one place
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {skills.length} {skills.length === 1 ? 'tool' : 'tools'} across {Object.keys(skillGroups).length} {Object.keys(skillGroups).length === 1 ? 'category' : 'categories'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(skillGroups).map(([category, categorySkills]) => (
                <div key={category}>
                  <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <div
                        key={skill.id || skill.name}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                        title={`${skill.name}: ${skill.level}%`}
                      >
                        <span className="font-mono text-xs font-semibold text-ink-2">
                          {skill.name}
                        </span>
                        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent">
                          {skill.level}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
