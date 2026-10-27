import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePreset } from '../types';
import {
  Heart,
  Layers,
  Mail,
  Palette,
  PenLine,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FloatingNavbar } from './ui/floating-navbar';
import { NavbarMenu, type NavbarMenuItem } from './ui/navbar-menu';

interface NavbarProps {
  activeSection: string;
}

const SECTION_IDS = ['hero', 'work', 'stack', 'thoughts', 'guestbook', 'contact'];

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, setTheme, soundEnabled, toggleSound, playSound } = useTheme();

  const themeOptions: { id: ThemePreset; name: string; color: string }[] = [
    { id: 'neon', name: 'CYAN', color: 'bg-cyan-600' },
    { id: 'white', name: 'WHITE', color: 'bg-white' },
    { id: 'pink', name: 'PINK', color: 'bg-pink-600' },
    { id: 'violet', name: 'VIOLET', color: 'bg-purple-700' },
  ];
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    SECTION_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (href: string) => {
    playSound('click');
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const exploreItems: NavbarMenuItem[] = [
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
    {
      label: 'Change accent',
      desc: `Current: ${themeOptions.find((option) => option.id === theme)?.name ?? 'CYAN'}`,
      icon: Palette,
      onClick: () => {
        const currentIndex = themeOptions.findIndex((option) => option.id === theme);
        setTheme(themeOptions[(currentIndex + 1) % themeOptions.length].id);
      },
    },
    {
      label: soundEnabled ? 'Mute interface audio' : 'Enable interface audio',
      desc: 'Toggle interface sounds',
      icon: soundEnabled ? VolumeX : Volume2,
      onClick: () => {
        toggleSound();
        playSound('toggle');
      },
    },
  ];

  const linkClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors sm:px-3.5 sm:text-[11px] sm:tracking-[0.14em] ${
      active
        ? 'bg-accent/10 text-accent'
        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
    }`;

  return (
    <FloatingNavbar appearAfter={90}>
      <div className="w-full max-w-4xl">
        <div className="liquid-glass navbar-bar-glass flex w-full items-center gap-1 rounded-full p-1.5 sm:gap-2 sm:px-2.5 sm:py-2">
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              playSound('click');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line sm:h-9 sm:w-9"
            title="muteeb.in — back to top"
          >
            <img src="/images/logo.png" alt="Muteeb logo" className="h-full w-full object-cover" />
          </a>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1">
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

          <div className="flex shrink-0 items-center gap-1">
            <div className="liquid-glass-inset hidden items-center gap-1 rounded-full p-1 sm:flex">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  title={`Switch accent to ${option.name}`}
                  aria-label={`Switch accent to ${option.name}`}
                  className={`h-4 w-4 rounded-full transition-transform sm:h-5 sm:w-5 ${option.color} ${
                    theme === option.id
                      ? 'scale-110 ring-2 ring-accent ring-offset-1 ring-offset-canvas'
                      : 'opacity-65 hover:scale-105 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                toggleSound();
                playSound('toggle');
              }}
              className={`hidden h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-surface-2 sm:flex ${
                soundEnabled ? 'text-accent' : 'text-ink-3 opacity-70'
              }`}
              title={soundEnabled ? 'Mute interface audio' : 'Enable interface audio'}
              aria-label={soundEnabled ? 'Mute interface audio' : 'Enable interface audio'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => scrollTo('#contact')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent-deep sm:h-9 sm:w-auto sm:gap-2 sm:px-4 sm:font-mono sm:text-[11px] sm:font-bold sm:uppercase sm:tracking-[0.14em]"
              title="Say hi"
              aria-label="Say hi"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Say hi</span>
            </button>
          </div>
        </div>
      </div>
    </FloatingNavbar>
  );
};
