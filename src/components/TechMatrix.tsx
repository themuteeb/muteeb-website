import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Skill } from '../types';
import { Code2 } from 'lucide-react';

interface TechMatrixProps {
  skills: Skill[];
}

export const TechMatrix: React.FC<TechMatrixProps> = ({ skills }) => {
  const { bgAccentClass, textAccentClass } = useTheme();

  return (
    <section id="stack" className="py-24 bg-zinc-950 border-b-2 border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
            // TOOLS & LANGUAGES
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
            THINGS <span className={`underline decoration-4 ${textAccentClass}`}>I USE</span>
          </h2>
        </div>

        {skills.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-800 bg-zinc-950 font-mono text-zinc-400">
            NO TOOLS ADDED YET.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {skills.map((skill) => (
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

                <div className="w-full h-3 bg-zinc-900 border border-zinc-800 p-0.5">
                  <div
                    className={`h-full ${bgAccentClass} transition-all duration-700 ease-out`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
