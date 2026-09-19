import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Project } from '../types';
import { ExternalLink, Eye, Hand, Star } from 'lucide-react';
import { CardStack } from './ui/card-stack';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface ProjectsProps {
  projects: Project[];
}

export const ProjectsSection: React.FC<ProjectsProps> = ({ projects }) => {
  const { textAccentClass, playSound } = useTheme();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => p.category && cats.add(p.category.toUpperCase()));
    return ['ALL', ...Array.from(cats)];
  }, [projects]);

  const filteredProjects =
    activeCategory === 'ALL'
      ? projects
      : projects.filter((p) => p.category?.toUpperCase() === activeCategory);

  const featuredProjects = useMemo(
    () =>
      projects
        .filter((p) => p.featured)
        .slice(0, 5)
        .map((p) => ({ ...p, id: p.id })),
    [projects]
  );

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

        {/* featured card stack */}
        {featuredProjects.length > 1 && (
          <div className="mb-16 sm:mb-20">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">
                <Star className="h-3.5 w-3.5 text-accent" />
                featured — swipe or tap the deck
              </div>
              <div className="hidden items-center gap-1.5 font-mono text-[10px] text-ink-3 sm:flex">
                <Hand className="h-3.5 w-3.5" />
                drag to shuffle
              </div>
            </div>

            <CardStack
              items={featuredProjects}
              offset={14}
              scaleFactor={0.045}
              className="mx-auto h-[400px] max-w-xl sm:h-[430px]"
              renderCard={(project, isTop) => (
                <FeaturedProjectCard
                  project={project}
                  isTop={isTop}
                  onDetails={() => {
                    playSound('click');
                    setSelectedProject(project);
                  }}
                />
              )}
            />
          </div>
        )}

        {/* grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center font-mono text-sm text-ink-3">
            no projects found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, idx) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-[0_20px_60px_-16px_rgba(0,0,0,0.9)]"
              >
                {/* image */}
                <div className="relative h-52 overflow-hidden border-b border-line bg-surface-2">
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
                  <div className="absolute left-3 top-3 rounded-full border border-line bg-canvas/85 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2 backdrop-blur-sm">
                    {project.category}
                  </div>
                  {project.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black shadow-[0_0_16px_rgba(34,212,114,0.45)]">
                      featured
                    </div>
                  )}
                </div>

                {/* content */}
                <div className="relative flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="mb-1.5 text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                      {project.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 font-mono text-xs leading-relaxed text-ink-3">
                      {project.subtitle || project.description}
                    </p>

                    {project.metrics && Object.keys(project.metrics).length > 0 && (
                      <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-2.5 font-mono text-[11px]">
                        {Object.entries(project.metrics)
                          .slice(0, 2)
                          .map(([k, v]) => (
                            <div key={k} className="flex flex-col">
                              <span className="text-[9px] font-semibold uppercase text-ink-3">
                                {k}
                              </span>
                              <span className={`font-bold ${textAccentClass}`}>{v}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {(project.tags || ['REACT', 'TYPESCRIPT', 'TAILWIND']).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-4 font-mono text-xs">
                    <button
                      onClick={() => {
                        playSound('click');
                        setSelectedProject(project);
                      }}
                      className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
                    >
                      <Eye className="h-4 w-4" /> details
                    </button>

                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSound('click')}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-all duration-300 hover:border-accent/60 hover:text-accent hover:shadow-[0_0_16px_rgba(34,212,114,0.25)]"
                        title="Open live app"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* case study modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setSelectedProject(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 font-mono text-ink-2 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {'// project archive'}
                </span>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  {selectedProject.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[11px] font-bold uppercase text-ink-2 transition-colors hover:border-accent/50 hover:text-accent"
              >
                close ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="h-64 overflow-hidden rounded-xl border border-line bg-surface-2 sm:h-72">
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-3">
                  description / highlights
                </h4>
                <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-ink-2">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.metrics &&
                Object.keys(selectedProject.metrics).length > 0 && (
                  <div>
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-3">
                      key highlights
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {Object.entries(selectedProject.metrics).map(([k, v]) => (
                        <div
                          key={k}
                          className="group relative overflow-hidden rounded-xl border border-line bg-canvas p-3.5"
                        >
                          <div className="text-[10px] uppercase text-ink-3">{k}</div>
                          <div className="mt-0.5 text-lg font-extrabold text-accent">
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-3">
                  technologies utilized
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProject.tags || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-bold uppercase text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProject.live_url && (
                <div className="flex justify-end border-t border-line pt-5">
                  <a
                    href={selectedProject.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all duration-300 hover:shadow-[0_0_28px_rgba(34,212,114,0.5)]"
                  >
                    <ExternalLink className="h-4 w-4" /> visit project
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  featured card for the CardStack                                     */
/* ------------------------------------------------------------------ */

const FeaturedProjectCard = ({
  project,
  isTop,
  onDetails,
}: {
  project: Project;
  isTop: boolean;
  onDetails: () => void;
}) => {
  const { playSound } = useTheme();

  return (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]">
      <div className="relative h-44 shrink-0 overflow-hidden border-b border-line bg-surface-2 sm:h-48">
        <img
          src={
            project.image_url ||
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
          }
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover opacity-85 grayscale-[35%] transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <div className="absolute left-3 top-3 rounded-full border border-line bg-canvas/85 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-2 backdrop-blur-sm">
          {project.category}
        </div>
        {isTop && (
          <div className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black shadow-[0_0_16px_rgba(34,212,114,0.45)]">
            featured
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <h3 className="mb-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {project.title}
          </h3>
          <p className="mb-4 line-clamp-2 font-mono text-xs leading-relaxed text-ink-3">
            {project.subtitle || project.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {(project.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-xs">
          <button
            onClick={onDetails}
            className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
          >
            <Eye className="h-4 w-4" /> details
          </button>
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click');
              }}
              className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-ink-2 transition-colors hover:text-accent"
            >
              live <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
