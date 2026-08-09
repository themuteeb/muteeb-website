import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Skill } from '../types';
import { Code2 } from 'lucide-react';

interface TechMatrixProps {
  skills: Skill[];
}

export const TechMatrix: React.FC<TechMatrixProps> = ({ skills }) => {
  const { bgAccentClass, textAccentClass } = useTheme();

  const defaultSkills: Skill[] = [
    { id: 1, name: 'HTML', category: 'THINGS I USE', level: 95, display_order: 1 },
    { id: 2, name: 'CSS', category: 'THINGS I USE', level: 92, display_order: 2 },
    { id: 3, name: 'JavaScript', category: 'THINGS I USE', level: 90, display_order: 3 },
    { id: 4, name: 'Python', category: 'THINGS I USE', level: 85, display_order: 4 },
    { id: 5, name: 'Java', category: 'THINGS I USE', level: 80, display_order: 5 },
  ];

  const skillList = skills.length > 0 ? skills : defaultSkills;

  return (
    <section id="stack" className="py-24 bg-zinc-950 border-b-2 border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
            // TOOLS & LANGUAGES
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
            THINGS <span className={`underline decoration-4 ${textAccentClass}`}>I USE</span>
          </h2>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {skillList.map((skill) => (
            <div
              key={skill.id || skill.name}
              className="p-6 bg-black border-2 border-zinc-800 hover:border-white transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code2 className={`w-4 h-4 ${textAccentClass}`} />
                  <span className="font-mono text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">
                    TOOL
                  </span>
                </div>
                <span className="font-mono font-black text-white text-base">
                  {skill.level}%
                </span>
              </div>

              <div className="font-mono font-black text-xl text-white group-hover:text-zinc-200 mb-4 uppercase">
                {skill.name}
              </div>

              {/* High Contrast Progress Bar */}
              <div className="w-full h-3 bg-zinc-900 border border-zinc-800 p-0.5">
                <div
                  className={`h-full ${bgAccentClass} transition-all duration-700 ease-out`}
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};