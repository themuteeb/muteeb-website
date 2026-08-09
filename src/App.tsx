import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProjectsSection } from './components/ProjectsSection';
import { NowSection } from './components/NowSection';
import { TechMatrix } from './components/TechMatrix';
import { ThoughtsSection } from './components/ThoughtsSection';
import { GuestbookSection } from './components/GuestbookSection';
import { ContactTerminal } from './components/ContactTerminal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { Profile, Project, Thought, Skill, GuestbookEntry, ContactMessage } from './types';
import { handleGoogleRedirect } from './lib/google-auth';

handleGoogleRedirect();

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const sections = ['hero', 'work', 'now', 'stack', 'thoughts', 'guestbook', 'contact'];
    const observers: IntersectionObserver[] = [];

    const setupObservers = () => {
      sections.forEach((id) => {
        const el = document.querySelector(`#${id}`);
        if (!el) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActiveSection(id);
          },
          { threshold: 0.3 }
        );
        observer.observe(el);
        observers.push(observer);
      });
    };

    if (!loading) {
      setTimeout(setupObservers, 100);
    }

    return () => observers.forEach(o => o.disconnect());
  }, [loading]);

  useEffect(() => {
    const checkSecretRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (
        path.includes('/admin') ||
        path.includes('/muteeb-admin') ||
        path.includes('/secret') ||
        search.includes('admin=true') ||
        search.includes('cms=1') ||
        hash === '#admin'
      ) {
        setIsAdminOpen(true);
      }
    };

    checkSecretRoute();
    window.addEventListener('popstate', checkSecretRoute);
    return () => window.removeEventListener('popstate', checkSecretRoute);
  }, []);

  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
        return;
      }

      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20);
      if (keyBuffer.endsWith('muteeb')) {
        setIsAdminOpen(true);
        keyBuffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pRes, projRes, tRes, sRes, gRes, mRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/projects'),
        fetch('/api/thoughts'),
        fetch('/api/skills'),
        fetch('/api/guestbook'),
        fetch('/api/messages'),
      ]);

      if (pRes.ok) { const d = await pRes.json(); if (d) setProfile(d); }
      if (projRes.ok) { const d = await projRes.json(); if (Array.isArray(d)) setProjects(d); }
      if (tRes.ok) { const d = await tRes.json(); if (Array.isArray(d)) setThoughts(d); }
      if (sRes.ok) { const d = await sRes.json(); if (Array.isArray(d)) setSkills(d); }
      if (gRes.ok) { const d = await gRes.json(); if (Array.isArray(d)) setGuestbook(d); }
      if (mRes.ok) { const d = await mRes.json(); if (Array.isArray(d)) setMessages(d); }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) { const data = await res.json(); setProfile(data); }
  };

  const handleSaveProject = async (project: Partial<Project>) => {
    const method = project.id ? 'PUT' : 'POST';
    const res = await fetch('/api/projects', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (res.ok) fetchAllData();
  };

  const handleDeleteProject = async (id: number) => {
    const res = await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchAllData();
  };

  const handleSaveThought = async (thought: Partial<Thought>) => {
    const method = thought.id ? 'PUT' : 'POST';
    const res = await fetch('/api/thoughts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thought),
    });
    if (res.ok) fetchAllData();
  };

  const handleLikeThought = async (id: number) => {
    const res = await fetch('/api/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setThoughts(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const handleDeleteThought = async (id: number) => {
    const res = await fetch('/api/thoughts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchAllData();
  };

  const handleSaveSkill = async (skill: Partial<Skill>) => {
    const method = skill.id ? 'PUT' : 'POST';
    const res = await fetch('/api/skills', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });
    if (res.ok) fetchAllData();
  };

  const handleDeleteSkill = async (id: number) => {
    const res = await fetch('/api/skills', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchAllData();
  };

  const handleAddGuestbook = async (entry: {
    name: string; handle: string; message: string;
    avatar_color: string; badge: string;
  }) => {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const newEntry = await res.json();
      setGuestbook(prev => [newEntry, ...prev]);
    }
  };

  const handleDeleteGuestbook = async (id: number) => {
    const res = await fetch('/api/guestbook', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGuestbook(prev => prev.filter(g => g.id !== id));
  };

  const handleSendMessage = async (msg: {
    sender_name: string; sender_email: string;
    subject: string; body: string;
  }) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages(prev => [newMsg, ...prev]);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    const res = await fetch('/api/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setMessages(prev => prev.filter(m => m.id !== id));
  };

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent animate-spin mx-auto rounded-full" />
          <p className="text-zinc-400 text-xs uppercase tracking-widest">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="bg-black text-white min-h-screen selection:bg-cyan-400 selection:text-black font-sans antialiased">
          <Navbar activeSection={activeSection} />

          <Hero profile={profile} onOpenContact={scrollToContact} />

          <ProjectsSection projects={projects} />

          <NowSection />

          <TechMatrix skills={skills} />

          <ThoughtsSection thoughts={thoughts} onLikeThought={handleLikeThought} />

          <GuestbookSection entries={guestbook} onAddEntry={handleAddGuestbook} />

          <ContactTerminal email={profile?.email} onSendMessage={handleSendMessage} />

          <Footer profile={profile} />

          {isAdminOpen && (
            <AdminModal
              profile={profile}
              projects={projects}
              thoughts={thoughts}
              skills={skills}
              messages={messages}
              guestbook={guestbook}
              onUpdateProfile={handleUpdateProfile}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onSaveThought={handleSaveThought}
              onDeleteThought={handleDeleteThought}
              onSaveSkill={handleSaveSkill}
              onDeleteSkill={handleDeleteSkill}
              onDeleteGuestbook={handleDeleteGuestbook}
              onDeleteMessage={handleDeleteMessage}
              onClose={() => setIsAdminOpen(false)}
            />
          )}
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
