import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, Code, Compass, Lightbulb, Coffee, Music, Languages, Moon } from 'lucide-react';

export const NowSection: React.FC = () => {
  const { bgAccentClass, textAccentClass, borderAccentClass } = useTheme();

  const nowFocus = [
    {
      title: 'LEARNING',
      icon: BookOpen,
      desc: 'Getting deep into the tricky parts of JavaScript — promises, closures, and how the async engine actually works under the hood.'
    },
    {
      title: 'BUILDING',
      icon: Code,
      desc: 'Small digital tools that fix highly specific annoyances I have. Nobody asked for them, but they\'re fun to create.'
    },
    {
      title: 'READING',
      icon: Compass,
      desc: 'Mostly technical documentation and web design blogs. MDN has essentially become my evening reading.'
    },
    {
      title: 'THINKING',
      icon: Lightbulb,
      desc: 'About why certain websites feel instantly comfortable to use, and how to strip unnecessary weight off the web.'
    }
  ];

  const quickFacts = [
    {
      icon: Coffee,
      text: 'I run on tea, not coffee'
    },
    {
      icon: Music,
      text: "Can't write code in silence"
    },
    {
      icon: Languages,
      text: 'Know 4 languages, master of none'
    },
    {
      icon: Moon,
      text: 'Midnight is my most productive hour'
    }
  ];

  return (
    <section id="now" className="py-24 bg-black border-b-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* NOW SECTION */}
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

        {/* QUICK FACTS SECTION */}
        <div className="pt-8 border-t-2 border-zinc-800">
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
      </div>
    </section>
  );
};
