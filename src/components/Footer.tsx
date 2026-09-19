import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  profile: Profile | null;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const { bgAccentClass, playSound } = useTheme();

  const scrollToTop = () => {
    playSound('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white border-t-4 border-zinc-800 py-16 font-mono relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Action Bar with Scroll to Top */}
        <div className="border-b-2 border-zinc-800 pb-8 flex items-center justify-between">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            // BACK TO TOP
          </div>

          <button
            onClick={scrollToTop}
            className={`p-4 ${bgAccentClass} hover:brightness-110 transition-transform active:scale-95 flex items-center justify-center`}
            title="Return to top"
          >
            <ArrowUp className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="text-xs">
          <div className="text-zinc-500 font-bold uppercase mb-3">// ABOUT MUTEEB.IN</div>
          <p className="text-zinc-400 leading-relaxed font-sans text-xs max-w-xl">
            I make things for the internet because it feels like magic you can actually use.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-zinc-900 text-zinc-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-4 font-bold">
          <div>
            © {new Date().getFullYear()} BABA MUTEEB. ALL RIGHTS RESERVED.
          </div>
          <div className="text-zinc-400">
            MUTEEB.IN
          </div>
        </div>
      </div>
    </footer>
  );
};