import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePreset } from '../types';
import { Volume2, VolumeX, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const { theme, setTheme, soundEnabled, toggleSound, playSound, borderAccentClass, textAccentClass } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const themeOptions: { id: ThemePreset; name: string; color: string }[] = [
    { id: 'neon', name: 'CYAN', color: 'bg-cyan-400' },
    { id: 'lime', name: 'LIME', color: 'bg-lime-400' },
    { id: 'coral', name: 'CORAL', color: 'bg-rose-500' },
    { id: 'violet', name: 'VIOLET', color: 'bg-purple-500' },
    { id: 'mono', name: 'MONO', color: 'bg-white' },
  ];

  const navLinks = [
    { name: 'ABOUT', href: '#hero' },
    { name: 'PROJECTS', href: '#work' },
    { name: 'NOW', href: '#now' },
    { name: 'STACK', href: '#stack' },
    { name: 'THOUGHTS', href: '#thoughts' },
    { name: 'GUESTBOOK', href: '#guestbook' },
    { name: 'SAY HI', href: '#contact' },
  ];

  const scrollTo = (href: string) => {
    playSound('click');
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b-2 border-zinc-800 py-2.5 shadow-2xl'
          : 'bg-black/40 backdrop-blur-sm py-4 border-b border-zinc-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Navigation Logo - Uploaded Image */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); playSound('click'); }}
          className="group flex items-center gap-3 transition-transform active:scale-95"
          title="MUTEEB.IN"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 overflow-hidden border-2 border-zinc-800 bg-black group-hover:border-white transition-colors">
            <img
              src="/images/logo.png"
              alt="Muteeb Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="font-sans font-black text-xl tracking-tighter uppercase text-white hover:text-zinc-300 hidden sm:inline-block">
            MUTEEB<span className={textAccentClass}>.IN</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-xs tracking-wider">
          {navLinks.map((link) => {
            const isActive = activeSection === link.name.toLowerCase();
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                className={`px-3 py-1.5 transition-all uppercase font-bold border ${
                  isActive
                    ? `${borderAccentClass} ${textAccentClass} bg-zinc-900`
                    : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
                onMouseEnter={() => playSound('hover')}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Palette Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-none">
            {themeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`Switch accent to ${t.name}`}
                className={`w-5 h-5 transition-transform ${t.color} ${
                  theme === t.id ? 'ring-2 ring-white scale-110 z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              />
            ))}
          </div>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => { toggleSound(); playSound('toggle'); }}
            className={`p-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors ${
              soundEnabled ? textAccentClass : 'opacity-50'
            }`}
            title={soundEnabled ? 'Mute Interface Audio' : 'Enable Interface Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); playSound('click'); }}
            className="lg:hidden p-2 border border-zinc-800 bg-zinc-900 text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b-2 border-zinc-800 bg-black/95 backdrop-blur-xl px-4 py-6 mt-3 space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                className={`p-3 border text-center font-bold text-sm uppercase ${
                  activeSection === link.name.toLowerCase()
                    ? `${borderAccentClass} ${textAccentClass} bg-zinc-900`
                    : 'border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase">Accent Palette:</span>
              <div className="flex gap-2">
                {themeOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-6 h-6 ${t.color} ${theme === t.id ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
