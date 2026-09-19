import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Project } from '../types';
import { ExternalLink, Eye } from 'lucide-react';

interface ProjectsProps {
  projects: Project[];
}

export const ProjectsSection: React.FC<ProjectsProps> = ({ projects }) => {
  const { bgAccentClass, borderAccentClass, textAccentClass, playSound } = useTheme();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = ['ALL', 'WEB APPS', 'SYSTEMS', 'VISUAL', 'EXPERIMENTS'];

  const filteredProjects = activeCategory === 'ALL'
    ? projects
    : projects.filter(p => p.category?.toUpperCase() === activeCategory);

  return (
    <section id="work" className="py-24 bg-black border-b-2 border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
              // SELECTED ARCHIVE
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
              FEATURED <span className={`underline decoration-4 ${textAccentClass}`}>PROJECTS</span>
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); playSound('click'); }}
                className={`px-4 py-2 uppercase font-extrabold border-2 transition-all ${
                  activeCategory === cat
                    ? `${bgAccentClass} ${borderAccentClass}`
                    : 'border-zinc-800 text-zinc-400 bg-zinc-950 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Masonry/Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-800 bg-zinc-950 font-mono text-zinc-400">
            NO PROJECTS FOUND IN THIS CATEGORY.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-zinc-950 border-2 border-zinc-800 hover:border-white transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Image Container with High-Contrast Overlay */}
                <div className="relative h-64 overflow-hidden bg-zinc-900 border-b-2 border-zinc-800">
                  <img
                    src={project.image_url || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'}
                    alt={project.title}
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black border border-zinc-700 px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white tracking-wider">
                    {project.category}
                  </div>
                  {project.featured && (
                    <div className={`absolute top-3 right-3 ${bgAccentClass} px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider`}>
                      FEATURED
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-zinc-200 tracking-tight uppercase mb-2">
                      {project.title}
                    </h3>
                    <p className="font-mono text-xs text-zinc-400 uppercase tracking-wide mb-4 line-clamp-2">
                      {project.subtitle || project.description}
                    </p>

                    {/* Metrics Banner */}
                    {project.metrics && Object.keys(project.metrics).length > 0 && (
                      <div className="mb-4 p-2.5 bg-black border border-zinc-800 font-mono text-[11px] flex items-center justify-between">
                        {Object.entries(project.metrics).slice(0, 2).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <span className="text-zinc-400 uppercase text-[9px] font-bold">{k}:</span>
                            <span className={`font-black ${textAccentClass}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tech Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {(project.tags || ['REACT', 'TYPESCRIPT', 'TAILWIND']).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300 font-bold uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-between font-mono text-xs">
                    <button
                      onClick={() => { setSelectedProject(project); playSound('click'); }}
                      className={`font-black uppercase flex items-center gap-1.5 ${textAccentClass} hover:underline`}
                    >
                      <Eye className="w-4 h-4" /> DETAILS
                    </button>

                    <div className="flex items-center gap-2">
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playSound('click')}
                          className={`p-2 ${bgAccentClass} font-bold`}
                          title="Open Live App"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case Study Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 border-2 border-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 font-mono text-zinc-200 shadow-2xl relative">
            <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-6">
              <div>
                <span className={`text-xs font-extrabold uppercase ${textAccentClass}`}>// PROJECT ARCHIVE</span>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">{selectedProject.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-white hover:bg-white hover:text-black font-bold uppercase text-xs"
              >
                [CLOSE X]
              </button>
            </div>

            <div className="space-y-6">
              <div className="h-72 bg-zinc-900 border border-zinc-800 overflow-hidden">
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">DESCRIPTION / HIGHLIGHTS:</h4>
                <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line font-sans font-medium">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.metrics && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">KEY HIGHLIGHTS:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(selectedProject.metrics).map(([k, v]) => (
                      <div key={k} className="p-3 bg-black border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase">{k}</div>
                        <div className={`text-lg font-black ${textAccentClass}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">TECHNOLOGIES UTILIZED:</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProject.tags || []).map((t) => (
                    <span key={t} className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs uppercase">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-zinc-800 flex items-center justify-end gap-3">
                {selectedProject.live_url && (
                  <a
                    href={selectedProject.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-6 py-2 ${bgAccentClass} font-black text-xs uppercase flex items-center gap-2`}
                  >
                    <ExternalLink className="w-4 h-4" /> VISIT PROJECT
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};