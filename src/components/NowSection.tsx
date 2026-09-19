import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { BookOpen, Code, Compass, Lightbulb, Coffee, Music, Languages, Moon, Sparkles, Star, Zap, Heart } from 'lucide-react';

interface NowSectionProps {
  profile: Profile | null;
}

const nowIconMap: Record<string, React.ElementType> = {
  'LEARNING': BookOpen,
  'BUILDING': Code,
  'READING': Compass,
  'THINKING': Lightbulb,
  'WORKING': Zap,
  'EXPLORING': Compass,
  'CREATING': Sparkles,
};

const factIconList = [Coffee, Music, Languages, Moon, Sparkles, Star, Zap, Heart];

export const NowSection: React.FC<NowSectionProps> = ({ profile }) => {
  const { textAccentClass, borderAccentClass } = useTheme();

  const nowFocusData = profile?.now_focus || [];
  const quickFactsData = profile?.quick_facts || [];

  const nowFocus = nowFocusData.map((item, idx) => ({
    title: item.title,
    icon: nowIconMap[item.title.toUpperCase()] || [BookOpen, Code, Compass, Lightbulb][idx % 4],
    desc: item.desc,
  }));

  const quickFacts = quickFactsData.map((text, idx) => ({
    icon: factIconList[idx % factIconList.length],
    text,
  }));

  if (nowFocus.length === 0 && quickFacts.length === 0) return null;

  return (
    <section id="now" className="py-24 bg-black border-b-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {nowFocus.length > 0 && (
          <div>
            <div className="mb-10">
              <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
                // CURRENT FOCUS & ACTIVITIES
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
                NOW: <span className={`underline decoration-4 ${textAccentClass}`}>WHAT I'M FOCUSED ON</span>
              </h2>
              <p className="font-mono text-xs text-zinc-400 mt-2 uppercase">
                What I'm currently spending my time and energy on
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nowFocus.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-zinc-950 border-2 border-zinc-800 hover:border-white transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 bg-black border ${borderAccentClass} ${textAccentClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-mono text-lg font-black text-white uppercase tracking-wider">
                        {item.title}
                      </h3>
                    </div>
                    <p className="font-sans text-sm text-zinc-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {quickFacts.length > 0 && (
          <div className={nowFocus.length > 0 ? "pt-8 border-t-2 border-zinc-800" : ""}>
            <div className="mb-8">
              <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
                // PERSONAL TRIVIA
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase font-sans">
                QUICK <span className={`underline decoration-4 ${textAccentClass}`}>FACTS</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickFacts.map((fact, idx) => {
                const Icon = fact.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 hover:border-zinc-500 transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${textAccentClass} shrink-0`} />
                    <span className="font-mono text-xs font-bold text-zinc-200 uppercase leading-snug">
                      {fact.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
