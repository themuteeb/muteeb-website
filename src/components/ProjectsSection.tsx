import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Project } from '../types';
import { ExternalLink, Star } from 'lucide-react';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { ThreeDMarquee } from './ui/three-d-marquee';
import { ExpandableCard } from './ui/expandable-card';

interface ProjectsProps {
  projects: Project[];
}

export const ProjectsSection: React.FC<ProjectsProps> = ({ projects }) => {
  const { textAccentClass, playSound } = useTheme();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => p.category && cats.add(p.category.toUpperCase()));
    return ['ALL', ...Array.from(cats)];
  }, [projects]);

  const filteredProjects =
    activeCategory === 'ALL'
      ? projects
      : projects.filter((p) => p.category?.toUpperCase() === activeCategory);

  return (
    <section id="work" className="relative border-b border-line bg-canvas py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* section header */}
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {'// projects'}
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Things I&apos;ve{' '}
              <span className="text-glow-accent text-accent">built</span>
            </h2>
            <TextGenerateEffect
              words="Projects, experiments and the occasional over-engineered weekend idea."
              className="mt-4 max-w-lg text-sm leading-relaxed text-ink-3"
              stagger={0.04}
            />
          </div>

          {/* category filter pills */}
          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  playSound('click');
                }}
                className={`rounded-full border px-4 py-2 font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? 'border-accent/60 bg-accent/15 text-accent shadow-[0_0_18px_rgba(34,212,114,0.2)]'
                    : 'border-line bg-surface text-ink-3 hover:border-line-2 hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center font-mono text-sm text-ink-3">
            no projects found in this category.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
              <span className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-accent" />
                project stream · {filteredProjects.length} items
              </span>
              <span>new projects appear here automatically</span>
            </div>
            <ThreeDMarquee
              duration={32}
              items={filteredProjects.map((project) => (
                <ExpandableCard
                  key={project.id}
                  actionLabel="view project details"
                  className="group overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-line-2"
                  expandedContent={
                    <div className="space-y-4">
                      <div>
                        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
                          project overview
                        </span>
                        <p className="whitespace-pre-line">{project.description}</p>
                      </div>
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-bright"
                        >
                          source code <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  }
                >
                  <div className="relative h-40 overflow-hidden border-b border-line bg-surface-2 sm:h-44">
                    <img
                      src={
                        project.image_url ||
                        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={project.title}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-80 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-line bg-canvas/85 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2 backdrop-blur-sm">
                      {project.category}
                    </span>
                    {project.featured && (
                      <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black shadow-[0_0_16px_rgba(34,212,114,0.45)]">
                        featured
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="mb-1.5 text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                      {project.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 font-mono text-xs leading-relaxed text-ink-3">
                      {project.subtitle || project.description}
                    </p>

                    {project.metrics && Object.keys(project.metrics).length > 0 && (
                      <div className="mb-4 flex gap-4 rounded-xl border border-line bg-canvas p-2.5 font-mono text-[11px]">
                        {Object.entries(project.metrics)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-[9px] font-semibold uppercase text-ink-3">
                                {key}
                              </span>
                              <span className={`font-bold ${textAccentClass}`}>{value}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {(project.tags || ['REACT', 'TYPESCRIPT', 'TAILWIND']).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {project.live_url && (
                      <div className="flex justify-end pt-3 font-mono text-xs">
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playSound('click')}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-all duration-300 hover:border-accent/60 hover:text-accent"
                          title="Open live app"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              ))}
            />
          </>
        )}
      </div>

    </section>
  );
};
