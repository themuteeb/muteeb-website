import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Thought } from '../types';
import { Clock, Heart } from 'lucide-react';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { ExpandableCard } from './ui/expandable-card';

interface ThoughtsProps {
  thoughts: Thought[];
  onLikeThought: (id: number) => void;
}

export const ThoughtsSection: React.FC<ThoughtsProps> = ({ thoughts, onLikeThought }) => {
  const { playSound } = useTheme();
  const [committedSearch, setCommittedSearch] = useState('');

  const filtered = thoughts.filter((t) => {
    const q = committedSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.summary || '').toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const handleSearchSubmit = (value: string) => {
    if (!value.trim()) return;
    playSound('submit');
    setCommittedSearch(value.trim());
  };

  return (
    <section id="thoughts" className="border-b border-line bg-surface/40 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {'// blog & writings'}
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Thoughts &{' '}
              <span className="text-accent">articles</span>
            </h2>
            <TextGenerateEffect
              words="Things I noticed, learned the hard way, or just felt like writing down."
              className="mt-4 max-w-lg text-sm leading-relaxed text-ink-3"
              stagger={0.04}
            />
          </div>

          <div className="w-full md:w-96">
            <PlaceholdersAndVanishInput
              placeholders={[
                'Search articles or tags…',
                'Try “design”…',
                'Try “javascript”…',
                'Try “life”…',
              ]}
              onSubmit={handleSearchSubmit}
            />
            {committedSearch && (
              <button
                type="button"
                onClick={() => {
                  setCommittedSearch('');
                  playSound('click');
                }}
                className="mt-2 ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-3 transition-colors hover:text-accent"
              >
                ✕ clear filter{committedSearch ? `: “${committedSearch}”` : ''}
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center font-mono text-sm text-ink-3">
            no articles match that search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((thought) => (
              <ExpandableCard
                key={thought.id}
                actionLabel="read article"
                collapseLabel="close article"
                onToggle={() => playSound('click')}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl liquid-glass transition-colors duration-300"
                expandedContent={
                  <div className="whitespace-pre-line font-sans text-[15px] leading-relaxed text-ink-2">
                    {thought.content || thought.summary}
                  </div>
                }
              >
                <div className="relative min-w-0 flex-1 p-5 pb-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 font-mono text-[11px] text-ink-3">
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {(thought.read_time || '3 min read').trim().toLowerCase()}
                    </span>
                    <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
                      {(thought.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="max-w-full break-words rounded-full border border-line bg-canvas/75 px-2 py-0.5 text-[10px] font-semibold text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="mb-2 line-clamp-2 min-h-[3.5rem] text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-2xl">
                    {thought.title}
                  </h3>

                  <p className="line-clamp-3 min-h-[4.5rem] font-sans text-sm leading-relaxed text-ink-3">
                    {thought.summary}
                  </p>
                </div>

                <div className="relative flex justify-end border-t border-line px-5 py-3.5 font-mono text-xs">
                  <button
                    onClick={() => {
                      onLikeThought(thought.id);
                      playSound('toggle');
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 font-bold text-ink-2 transition-all duration-300 hover:border-rose-500/50 hover:text-rose-400"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    <span>{thought.likes_count || 0}</span>
                  </button>
                </div>
              </ExpandableCard>
            ))}
          </div>
        )}
      </div>

    </section>
  );
};
