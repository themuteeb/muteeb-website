import { useState, useEffect } from 'react';
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

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeSection] = useState('hero');

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
      const adminPass = localStorage.getItem('__admin_custom_passcode') || '';
      const [pRes, projRes, tRes, sRes, gRes, mRes] = await Promise.all([
        fetch('/api/profile', { headers: adminPass ? { 'X-Admin-Auth': adminPass } : {} }),
        fetch('/api/projects'),
        fetch('/api/thoughts'),
        fetch('/api/skills'),
        fetch('/api/guestbook'),
        fetch('/api/messages'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData) setProfile(pData);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) setProjects(projData);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) setThoughts(tData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) setSkills(sData);
      }
      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData)) setGuestbook(gData);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData)) setMessages(mData);
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    const adminPass = localStorage.getItem('__admin_custom_passcode') || '';
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Auth': adminPass,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
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

  const handleAddGuestbook = async (entry: { name: string; handle: string; message: string; avatar_color: string; badge: string }) => {
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

  const handleSendMessage = async (msg: { sender_name: string; sender_email: string; subject: string; body: string }) => {
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
    const contactElem = document.querySelector('#contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="bg-black text-white min-h-screen selection:bg-cyan-400 selection:text-black font-sans antialiased">
          <Navbar activeSection={activeSection} />
          <Hero profile={profile} onOpenContact={scrollToContact} />

          <ProjectsSection projects={projects} />

          <NowSection profile={profile} />

          <TechMatrix skills={skills} />

          <ThoughtsSection thoughts={thoughts} onLikeThought={handleLikeThought} />

          <GuestbookSection entries={guestbook} onAddEntry={handleAddGuestbook} />

          <ContactTerminal
            email={profile?.email}
            instagramHandle={profile?.instagram_handle}
            onSendMessage={handleSendMessage}
          />

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
