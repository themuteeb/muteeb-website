import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { ArrowUp, Heart } from 'lucide-react';

interface FooterProps {
  profile: Profile | null;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const { playSound } = useTheme();

  const scrollToTop = () => {
    playSound('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-canvas py-14 font-mono">
      {/* accent top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      <div className="absolute -top-24 left-1/2 h-48 w-[480px] -translate-x-1/2 rounded-full bg-accent/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-line pb-8">
          <div>
            <div className="font-mono text-sm font-bold tracking-tight text-ink">
              muteeb<span className="text-accent">.in</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-ink-3">
              {'// back to top'}
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-all duration-300 hover:border-accent/60 hover:text-accent hover:shadow-[0_0_24px_rgba(34,212,114,0.3)]"
            title="Return to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs">
          <div className="mb-3 font-bold uppercase tracking-[0.22em] text-ink-3">
            {'// about muteeb.in'}
          </div>
          <p className="max-w-xl font-sans text-[13px] leading-relaxed text-ink-3">
            {profile?.bio ||
              'Full-stack developer building clean, fast web applications with TypeScript, React, and Supabase.'}
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-[11px] font-semibold text-ink-3 sm:flex-row">
          <div className="uppercase tracking-wider">
            © {new Date().getFullYear()} {profile?.full_name || 'Baba Muteeb'} — all rights
            reserved
          </div>
          <div className="flex items-center gap-1.5 uppercase tracking-wider">
            built with <Heart className="h-3 w-3 fill-accent text-accent" /> by Baba Muteeb
          </div>
        </div>
      </div>
    </footer>
  );
};
