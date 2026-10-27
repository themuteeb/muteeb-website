import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePreset } from '../types';
import {
  Compass,
  Heart,
  Layers,
  Mail,
  PenLine,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FloatingNavbar } from './ui/floating-navbar';
import { NavbarMenu, type NavbarMenuItem } from './ui/navbar-menu';

interface NavbarProps {
  activeSection: string;
}

const SECTION_IDS = ['hero', 'work', 'now', 'stack', 'thoughts', 'guestbook', 'contact'];

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, setTheme, soundEnabled, toggleSound, playSound } = useTheme();

  const themeOptions: { id: ThemePreset; name: string; color: string }[] = [
    { id: 'neon', name: 'CYAN', color: 'bg-cyan-400' },
    { id: 'lime', name: 'LIME', color: 'bg-lime-400' },
    { id: 'coral', name: 'CORAL', color: 'bg-rose-500' },
    { id: 'violet', name: 'VIOLET', color: 'bg-purple-500' },
  ];
  const [activeSection, setActiveSection] = useState('hero');

  // lightweight scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (href: string) => {
    playSound('click');
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const exploreItems: NavbarMenuItem[] = [
    {
      label: 'Now',
      desc: 'What I’m currently focused on',
      icon: Compass,
      href: '#now',
      active: activeSection === 'now',
    },
    {
      label: 'Stack',
      desc: 'Tools & languages I use',
      icon: Layers,
      href: '#stack',
      active: activeSection === 'stack',
    },
    {
      label: 'Thoughts',
      desc: 'Notes, essays & rambles',
      icon: PenLine,
      href: '#thoughts',
      active: activeSection === 'thoughts',
    },
    {
      label: 'Guestbook',
      desc: 'Leave a note for the internet',
      icon: Heart,
      href: '#guestbook',
      active: activeSection === 'guestbook',
    },
  ];

  const linkClass = (active: boolean) =>
    `rounded-full px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
      active
        ? 'bg-accent/10 text-accent'
        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
    }`;

  const pill = (
    <div className="liquid-glass flex flex-col gap-1.5 rounded-2xl p-2 sm:flex-row sm:items-center sm:gap-1.5 sm:p-1.5 sm:pl-2.5">
      <div className="flex items-center justify-between gap-2 sm:contents">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            playSound('click');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex items-center gap-2.5 pr-1 sm:order-1"
          title="muteeb.in — back to top"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-line transition-colors group-hover:border-accent/50">
            <img
              src="/images/logo.png"
              alt="Muteeb logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="hidden font-mono text-sm font-bold tracking-tight text-ink sm:inline">
            muteeb<span className="text-accent">.in</span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:order-3">
          <div className="liquid-glass-inset flex items-center gap-1 rounded-full p-1">
            {themeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`Switch accent to ${t.name}`}
                aria-label={`Switch accent to ${t.name}`}
                className={`h-4 w-4 rounded-full transition-transform sm:h-5 sm:w-5 ${t.color} ${
                  theme === t.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              toggleSound();
              playSound('toggle');
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-line transition-all duration-300 hover:border-accent/50 hover:text-accent ${
              soundEnabled ? 'text-accent' : 'text-ink-3 opacity-60'
            }`}
            title={soundEnabled ? 'Mute interface audio' : 'Enable interface audio'}
            aria-label={soundEnabled ? 'Mute interface audio' : 'Enable interface audio'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => scrollTo('#contact')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(34,212,114,0.5)] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:font-mono sm:text-[11px] sm:font-bold sm:uppercase sm:tracking-[0.14em]"
            title="Say hi"
            aria-label="Say hi"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Say hi</span>
          </button>
        </div>
      </div>

      <nav className="flex w-full items-center justify-around gap-0.5 border-t border-white/10 pt-1 sm:order-2 sm:w-auto sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={() => scrollTo('#hero')}
          className={linkClass(activeSection === 'hero')}
          onMouseEnter={() => playSound('hover')}
        >
          About
        </button>
        <button
          type="button"
          onClick={() => scrollTo('#work')}
          className={linkClass(activeSection === 'work')}
          onMouseEnter={() => playSound('hover')}
        >
          Projects
        </button>
        <NavbarMenu
          label="Explore"
          items={exploreItems}
          onItemClick={(item) => item.href && scrollTo(item.href)}
        />
      </nav>
    </div>
  );

  return (
    <FloatingNavbar appearAfter={90}>
      <div className="w-full max-w-3xl">{pill}</div>
    </FloatingNavbar>
  );
};
