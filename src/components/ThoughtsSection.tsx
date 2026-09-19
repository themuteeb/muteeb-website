import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Thought } from '../types';
import { ArrowRight, Clock, Heart } from 'lucide-react';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface ThoughtsProps {
  thoughts: Thought[];
  onLikeThought: (id: number) => void;
}

export const ThoughtsSection: React.FC<ThoughtsProps> = ({ thoughts, onLikeThought }) => {
  const { playSound } = useTheme();
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');

  // keep reader modal in sync when likes (or other fields) change in parent
  useEffect(() => {
    if (selectedThought) {
      const fresh = thoughts.find((x) => x.id === selectedThought.id);
      if (fresh && fresh.likes_count !== selectedThought.likes_count) {
        setSelectedThought(fresh);
      }
    }
  }, [thoughts]);

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
    setSearchTerm('');
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
              <span className="text-glow-accent text-accent">articles</span>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onSubmit={() => handleSearchSubmit(searchTerm)}
            />
            {committedSearch && (
              <button
                type="button"
                onClick={() => {
                  setCommittedSearch('');
                  setSearchTerm('');
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
            {filtered.map((thought, idx) => (
              <motion.article
                key={thought.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (idx % 2) * 0.08 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-2"
              >
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {thought.read_time || '3 min read'}
                    </span>
                    <div className="flex gap-1">
                      {(thought.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10px] font-semibold text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="mb-3 text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-2xl">
                    {thought.title}
                  </h3>

                  <p className="mb-6 font-sans text-sm leading-relaxed text-ink-3">
                    {thought.summary}
                  </p>
                </div>

                <div className="relative flex items-center justify-between border-t border-line pt-4 font-mono text-xs">
                  <button
                    onClick={() => {
                      setSelectedThought(thought);
                      playSound('click');
                    }}
                    className="flex items-center gap-2 font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
                  >
                    <span>read article</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

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
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* article reader modal */}
      {selectedThought && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setSelectedThought(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 font-sans text-ink-2 shadow-2xl sm:p-10"
          >
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                {'// article reader'}
              </span>
              <button
                onClick={() => setSelectedThought(null)}
                className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase text-ink-2 transition-colors hover:border-accent/50 hover:text-accent"
              >
                close ✕
              </button>
            </div>

            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {selectedThought.title}
            </h2>

            <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-line pb-4 font-mono text-[11px] text-ink-3">
              <span className="uppercase">read time: {selectedThought.read_time}</span>
              <span>·</span>
              <div className="flex gap-2">
                {(selectedThought.tags || []).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-bold text-accent"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="whitespace-pre-line font-sans text-[15px] leading-relaxed text-ink-2">
              {selectedThought.content}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 font-mono text-xs">
              <button
                onClick={() => {
                  // optimistic update for instant feedback in modal
                  setSelectedThought((prev) => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : prev);
                  onLikeThought(selectedThought.id);
                  playSound('toggle');
                }}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-bold uppercase tracking-wider text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(34,212,114,0.45)]"
              >
                <Heart className="h-4 w-4 fill-black" /> like this article (
                {selectedThought.likes_count || 0})
              </button>

              <button
                onClick={() => setSelectedThought(null)}
                className="rounded-full border border-line bg-surface-2 px-5 py-2.5 font-bold uppercase tracking-wider text-ink-2 transition-colors hover:text-ink"
              >
                back to list
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
