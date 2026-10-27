import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Project } from '../types';
import { ExternalLink, Star } from 'lucide-react';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { AppleCardsCarousel } from './ui/apple-cards-carousel';
import { ExpandableCard } from './ui/expandable-card';
import { ExpandableCardDemoGrid } from './ui/expandable-card-demo-grid';

interface ProjectsProps {
  projects: Project[];
}

interface ProjectCardPreviewProps {
  project: Project;
  textAccentClass: string;
  onLinkClick: () => void;
}

const ProjectCardPreview: React.FC<ProjectCardPreviewProps> = ({
  project,
  textAccentClass,
  onLinkClick,
}) => {
  const projectTags = project.tags?.length
    ? project.tags
    : ['REACT', 'TYPESCRIPT', 'TAILWIND'];

  return (
    <>
      <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-surface-2">
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
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1.5 line-clamp-1 min-h-6 text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
          {project.title}
        </h3>
        <p className="mb-3 line-clamp-2 min-h-9 font-mono text-xs leading-relaxed text-ink-3">
          {project.subtitle || project.description}
        </p>

        <div className="mb-3 min-h-14">
          {project.metrics && Object.keys(project.metrics).length > 0 && (
            <div className="flex min-h-14 gap-4 rounded-xl border border-line bg-canvas p-2.5 font-mono text-[11px]">
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
        </div>

        <div className="mb-3 flex h-7 items-start gap-1.5 overflow-hidden">
          {projectTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              title={tag}
              className="max-w-[5.5rem] truncate rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink-2"
            >
              {tag}
            </span>
          ))}
          {projectTags.length > 3 && (
            <span className="shrink-0 rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] text-ink-3">
              +{projectTags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto flex min-h-9 justify-end pt-1 font-mono text-xs">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLinkClick}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-all duration-300 hover:border-accent/60 hover:text-accent"
              title="Open live app"
              aria-label={`Open ${project.title} live app`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </>
  );
};

const ProjectCardDetails: React.FC<{ project: Project }> = ({ project }) => (
  <div className="space-y-5">
    <div>
      <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
        project overview
      </span>
      <p className="whitespace-pre-line">{project.description}</p>
    </div>
    {project.metrics && Object.keys(project.metrics).length > 0 && (
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(project.metrics).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-line bg-surface p-3">
            <span className="block font-mono text-[9px] font-semibold uppercase text-ink-3">
              {key}
            </span>
            <span className="mt-1 block font-mono text-sm font-bold text-accent">{value}</span>
          </div>
        ))}
      </div>
    )}
    <div className="flex flex-wrap gap-3">
      {project.github_url && (
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:border-accent/60"
        >
          source code <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {project.live_url && (
        <a
          href={project.live_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:border-accent/60"
        >
          live project <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  </div>
);

export const ProjectsSection: React.FC<ProjectsProps> = ({ projects }) => {
  const { textAccentClass, playSound } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((project) => project.category && cats.add(project.category.toUpperCase()));
    return ['ALL', ...Array.from(cats)];
  }, [projects]);

  const filteredProjects =
    activeCategory === 'ALL'
      ? projects
      : projects.filter((project) => project.category?.toUpperCase() === activeCategory);

  const renderPreview = (project: Project) => (
    <ProjectCardPreview
      project={project}
      textAccentClass={textAccentClass}
      onLinkClick={() => playSound('click')}
    />
  );

  return (
    <section id="work" className="relative border-b border-line bg-canvas py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {'// projects'}
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Things I&apos;ve{' '}
              <span className="text-accent">built</span>
            </h2>
            <TextGenerateEffect
              words="Projects, experiments and the occasional over-engineered weekend idea."
              className="mt-4 max-w-lg text-sm leading-relaxed text-ink-3"
              stagger={0.04}
            />
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  playSound('click');
                }}
                className={`rounded-full border px-4 py-2 font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === category
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-3 hover:border-line-2 hover:text-ink'
                }`}
              >
                {category}
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

            <div className="hidden lg:block">
              <ExpandableCardDemoGrid
                label="Things I’ve Built"
                items={filteredProjects.map((project) => ({
                  id: String(project.id),
                  title: project.title,
                  preview: renderPreview(project),
                  expandedContent: <ProjectCardDetails project={project} />,
                }))}
              />
            </div>

            <div className="lg:hidden">
              <AppleCardsCarousel
                label="Projects"
                items={filteredProjects.map((project) => (
                  <ExpandableCard
                    key={project.id}
                    actionLabel="view project details"
                    className="group flex h-full flex-col overflow-hidden rounded-2xl liquid-glass transition-colors duration-300"
                    expandedContent={<ProjectCardDetails project={project} />}
                  >
                    {renderPreview(project)}
                  </ExpandableCard>
                ))}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};
