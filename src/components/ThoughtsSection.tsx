import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Thought } from '../types';
import { Heart, Clock, ArrowRight } from 'lucide-react';

interface ThoughtsProps {
  thoughts: Thought[];
  onLikeThought: (id: number) => void;
}

export const ThoughtsSection: React.FC<ThoughtsProps> = ({ thoughts, onLikeThought }) => {
  const { bgAccentClass, textAccentClass, playSound } = useTheme();
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = thoughts.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section id="thoughts" className="py-24 bg-zinc-950 border-b-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
              // PERSONAL BLOG & WRITINGS
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
              THOUGHTS & <span className={`underline decoration-4 ${textAccentClass}`}>ARTICLES</span>
            </h2>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="SEARCH ARTICLES OR TAGS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-black border-2 border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-800 bg-zinc-950 font-mono text-zinc-400">
            NO ARTICLES YET.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((thought) => (
              <article
                key={thought.id}
                className="p-6 bg-black border-2 border-zinc-800 hover:border-white transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs text-zinc-400 mb-3">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5" /> {thought.read_time || '3 MIN READ'}
                    </span>
                    <div className="flex gap-1">
                      {(thought.tags || []).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-white group-hover:text-zinc-200 uppercase tracking-tight mb-3">
                    {thought.title}
                  </h3>

                  <p className="text-sm font-sans text-zinc-400 leading-relaxed mb-6">
                    {thought.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between font-mono text-xs">
                  <button
                    onClick={() => { setSelectedThought(thought); playSound('click'); }}
                    className={`font-black uppercase flex items-center gap-2 ${textAccentClass} hover:underline`}
                  >
                    <span>READ ARTICLE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { onLikeThought(thought.id); playSound('toggle'); }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-rose-950 border border-zinc-800 text-zinc-300 hover:text-rose-400 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{thought.likes_count || 0}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedThought && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 border-2 border-white max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-10 font-sans text-zinc-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-6">
              <span className={`font-mono text-xs font-bold uppercase ${textAccentClass}`}>
                // PERSONAL ARTICLE READER
              </span>
              <button
                onClick={() => setSelectedThought(null)}
                className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-white hover:bg-white hover:text-black font-mono font-bold uppercase text-xs"
              >
                [CLOSE X]
              </button>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4 font-sans">
              {selectedThought.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-400 mb-8 border-b border-zinc-800 pb-4">
              <span>READ TIME: {selectedThought.read_time}</span>
              <span>•</span>
              <div className="flex gap-2">
                {(selectedThought.tags || []).map(t => (
                  <span key={t} className={`px-2 py-0.5 ${bgAccentClass} text-black font-bold`}>{t}</span>
                ))}
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-zinc-300 font-sans leading-relaxed text-base whitespace-pre-line space-y-4">
              {selectedThought.content}
            </div>

            <div className="mt-10 pt-6 border-t-2 border-zinc-800 flex items-center justify-between font-mono text-xs">
              <button
                onClick={() => { onLikeThought(selectedThought.id); playSound('toggle'); }}
                className={`px-4 py-2 ${bgAccentClass} font-black uppercase flex items-center gap-2`}
              >
                <Heart className="w-4 h-4 fill-black" /> LIKE THIS ARTICLE ({selectedThought.likes_count || 0})
              </button>

              <button
                onClick={() => setSelectedThought(null)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white font-bold uppercase"
              >
                BACK TO LIST
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
