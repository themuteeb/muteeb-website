import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
  BookOpen,
  Code2,
  Compass,
  Heart,
  Layers,
  Mail,
  Menu,
  PenLine,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react';
import { FloatingNavbar } from './ui/floating-navbar';
import { NavbarMenu, type NavbarMenuItem } from './ui/navbar-menu';

interface NavbarProps {
  activeSection: string;
}

const SECTION_IDS = ['hero', 'work', 'now', 'stack', 'thoughts', 'guestbook', 'contact'];

export const Navbar: React.FC<NavbarProps> = () => {
  const { soundEnabled, toggleSound, playSound } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
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
    <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-canvas/80 p-1.5 pl-2.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      {/* logo */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          playSound('click');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="group flex items-center gap-2.5 pr-1"
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

      {/* desktop links */}
      <nav className="hidden items-center gap-0.5 lg:flex">
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

      {/* right controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            toggleSound();
            playSound('toggle');
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-line transition-all duration-300 hover:border-accent/50 hover:text-accent ${
            soundEnabled ? 'text-accent' : 'text-ink-3 opacity-60'
          }`}
          title={soundEnabled ? 'Mute interface audio' : 'Enable interface audio'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => scrollTo('#contact')}
          className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(34,212,114,0.5)] sm:flex"
        >
          <Mail className="h-3.5 w-3.5" />
          Say hi
        </button>

        {/* mobile toggle */}
        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            playSound('click');
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <FloatingNavbar appearAfter={90}>
      <div className="w-full max-w-3xl">
        {pill}

        {/* mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="mt-2 overflow-hidden rounded-2xl border border-line bg-canvas/90 p-2 backdrop-blur-xl lg:hidden"
            >
              {[
                { label: 'About', icon: Compass, href: '#hero' },
                { label: 'Projects', icon: Code2, href: '#work' },
                { label: 'Now', icon: Compass, href: '#now' },
                { label: 'Stack', icon: Layers, href: '#stack' },
                { label: 'Thoughts', icon: PenLine, href: '#thoughts' },
                { label: 'Guestbook', icon: Heart, href: '#guestbook' },
                { label: 'Contact', icon: Mail, href: '#contact' },
              ].map((item, idx) => (
                <motion.button
                  key={item.href}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * idx }}
                  onClick={() => scrollTo(item.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                    activeSection === item.href.slice(1)
                      ? 'bg-accent/10 text-accent'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </motion.button>
              ))}
              <div className="mt-1 flex items-center justify-between rounded-xl bg-surface px-3.5 py-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  <Wrench className="h-3.5 w-3.5" />
                  interface audio
                </span>
                <button
                  onClick={() => {
                    toggleSound();
                    playSound('toggle');
                  }}
                  className={`flex h-7 w-12 items-center rounded-full border px-0.5 transition-colors ${
                    soundEnabled
                      ? 'justify-end border-accent/50 bg-accent/20'
                      : 'justify-start border-line bg-surface-2'
                  }`}
                  aria-label="Toggle sound"
                >
                  <span
                    className={`h-5 w-5 rounded-full ${
                      soundEnabled ? 'bg-accent' : 'bg-ink-3'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FloatingNavbar>
  );
};
