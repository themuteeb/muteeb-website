import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { ArrowDown, Terminal, Zap, Globe } from 'lucide-react';

interface HeroProps {
  profile: Profile | null;
  onOpenContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({ profile, onOpenContact }) => {
  const { bgAccentClass, textAccentClass, glowAccentClass, playSound } = useTheme();

  const defaultRoles = [
    'STUDENT & NIGHT CODER',
    'MAKER OF INTERNET THINGS',
    'CLEAN UI EXPERIMENTER',
    'PROBLEM SOLVER',
    'CURIOSITY DRIVEN BUILDER'
  ];

  const roles = (profile?.typewriter_roles && profile.typewriter_roles.length > 0)
    ? profile.typewriter_roles
    : defaultRoles;

  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFull = roles[roleIndex];
    const speed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentFull.substring(0, displayText.length + 1));
        if (displayText.length === currentFull.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentFull.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, roleIndex, roles]);

  const scrollToWork = () => {
    playSound('click');
    const elem = document.querySelector('#work');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen pt-28 pb-16 flex flex-col justify-center border-b-2 border-zinc-800 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      <div className="absolute top-1/4 -right-12 w-96 h-96 bg-zinc-900 border border-zinc-800 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 font-mono text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-zinc-200 font-bold uppercase tracking-wider">
              {profile?.status_badge || 'A CURIOUS MIND WITH RESTLESS HANDS'}
            </span>
          </div>

          <div className="font-mono text-xs text-zinc-400 flex items-center gap-3 border-l-2 border-zinc-800 pl-4">
            <Globe className="w-3.5 h-3.5" />
            <span>{profile?.location || 'MUTEEB.IN // PERSONAL WEBSITE'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-extrabold text-zinc-400 tracking-widest uppercase">
            // HEY, I'M {profile?.full_name || 'BABA MUTEEB'}
          </h2>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter uppercase leading-[0.9] font-sans">
            A CURIOUS MIND <br />
            <span className={`inline-block underline decoration-4 ${textAccentClass} ${glowAccentClass}`}>
              WITH RESTLESS HANDS
            </span>
          </h1>
        </div>

        <div className="mt-6 mb-8 flex items-center gap-2 font-mono text-lg sm:text-2xl font-black text-zinc-200 uppercase bg-zinc-950/80 border-l-4 border-white p-4 max-w-3xl">
          <Terminal className={`w-5 h-5 shrink-0 ${textAccentClass}`} />
          <span>{displayText}</span>
          <span className={`inline-block w-3 h-6 ${bgAccentClass} animate-pulse`} />
        </div>

        <div className="p-6 bg-zinc-950 border-2 border-zinc-800 max-w-3xl mb-10 space-y-3 font-sans">
          <h3 className={`font-mono text-xs font-extrabold tracking-wider uppercase ${textAccentClass}`}>
            // ABOUT ME
          </h3>
          <p className="text-zinc-200 text-base sm:text-lg font-medium leading-relaxed">
            {profile?.title || 'I make things for the internet because it feels like magic you can actually use.'}
          </p>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            {profile?.bio || `On most days, you'll find me in a code editor — breaking something I made yesterday so I can make it a little better today. I'm not trying to be perfect. I just like that feeling when a problem finally makes sense.`}
          </p>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed italic">
            {profile?.headline || `"I'm a student who codes at night, loves clean design, and genuinely believes the best ideas happen when you aren't trying to force them."`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={scrollToWork}
            className={`px-8 py-4 font-black font-mono text-base uppercase transition-all transform hover:-translate-y-1 active:translate-y-0 ${bgAccentClass} flex items-center gap-3 ${glowAccentClass}`}
          >
            <span>SEE WHAT I'M UP TO</span>
            <ArrowDown className="w-5 h-5" />
          </button>

          <button
            onClick={() => { playSound('submit'); onOpenContact(); }}
            className="px-8 py-4 font-black font-mono text-base uppercase bg-zinc-900 text-white border-2 border-zinc-700 hover:border-white transition-all flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            <span>SAY HI</span>
          </button>
        </div>
      </div>
    </section>
  );
};
