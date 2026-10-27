import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
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

const CACHE_KEY = '__muteeb_cache';
const LEGACY_PASSCODE_KEY = '__admin_custom_passcode';

type PublicCache = {
  profile?: Profile | null;
  projects?: Project[];
  thoughts?: Thought[];
  skills?: Skill[];
  guestbook?: GuestbookEntry[];
};

type LegacyProfile = Profile & { admin_passcode?: string };
type LegacyGuestbookEntry = GuestbookEntry & { handle?: string };

const sanitizeGuestbookEntry = (entry: LegacyGuestbookEntry): GuestbookEntry => {
  const safeEntry = { ...entry };
  delete safeEntry.handle;
  return safeEntry;
};

const sanitizeProfileForCache = (profile: LegacyProfile | null | undefined): Profile | null => {
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: profile.full_name,
    title: profile.title,
    bio: profile.bio,
    status_badge: profile.status_badge,
    location: profile.location,
    available_for_work: profile.available_for_work,
    accent_color: profile.accent_color,
    // Contact details are owner-only and are never written to public storage.
    email: '',
    instagram_handle: profile.instagram_handle,
    headline: profile.headline,
    logo_url: profile.logo_url,
    sound_enabled: profile.sound_enabled,
    typewriter_roles: profile.typewriter_roles,
    now_focus: profile.now_focus,
    quick_facts: profile.quick_facts,
    github_url: profile.github_url,
    twitter_url: profile.twitter_url,
    linkedin_url: profile.linkedin_url,
  };
};

const loadCache = (): PublicCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as PublicCache & { messages?: unknown; profile?: LegacyProfile | null };
    const profile = sanitizeProfileForCache(saved.profile);
    const safeCache: PublicCache = {
      profile,
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      thoughts: Array.isArray(saved.thoughts) ? saved.thoughts : [],
      skills: Array.isArray(saved.skills) ? saved.skills : [],
      // Never persist pending moderation data in the public browser cache.
      guestbook: Array.isArray(saved.guestbook)
        ? (saved.guestbook as LegacyGuestbookEntry[])
            .filter((entry) => entry.approved)
            .map(sanitizeGuestbookEntry)
        : [],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(safeCache));
    return safeCache;
  } catch {
    return null;
  }
};

const saveCache = (data: PublicCache) => {
  try {
    const safeProfile = sanitizeProfileForCache(data.profile);
    const safeCache: PublicCache = {
      profile: safeProfile,
      projects: data.projects,
      thoughts: data.thoughts,
      skills: data.skills,
      guestbook: data.guestbook?.map(sanitizeGuestbookEntry).filter((entry) => entry.approved),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(safeCache));
  } catch {
    /* ignore quota errors */
  }
};

export default function App() {
  const [cached] = useState<PublicCache | null>(() => loadCache());
  const { adminPasscode, setAdminPasscode } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(cached?.profile || null);
  const [projects, setProjects] = useState<Project[]>(cached?.projects || []);
  const [thoughts, setThoughts] = useState<Thought[]>(cached?.thoughts || []);
  const [skills, setSkills] = useState<Skill[]>(cached?.skills || []);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(cached?.guestbook || []);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeSection] = useState('hero');

  useEffect(() => {
    // Remove credentials written by earlier versions. The passcode is now held
    // only in AuthContext memory and disappears when this tab is reloaded.
    try {
      localStorage.removeItem(LEGACY_PASSCODE_KEY);
    } catch {
      // Browser storage may be disabled; admin auth still uses in-memory state.
    }
  }, []);

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
        setIsAdminOpen((prev) => !prev);
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

  const clearAdminSession = () => {
    setAdminPasscode(null);
    setMessages([]);
    setGuestbook((current) => current.filter((entry) => entry.approved));
    setProfile((current) => current ? { ...current, email: '' } : current);
  };

  const fetchAllData = async (passcodeOverride?: string) => {
    try {
      const pass = passcodeOverride ?? adminPasscode ?? '';
      const headers: Record<string, string> = pass ? { 'X-Admin-Auth': pass } : {};
      const [pRes, projRes, tRes, sRes, gRes, mRes] = await Promise.all([
        fetch('/api/profile', { headers }),
        fetch('/api/projects'),
        fetch('/api/thoughts'),
        fetch('/api/skills'),
        fetch('/api/guestbook', { headers }),
        // Inbox is PII; the API returns it only after server-side auth.
        fetch('/api/messages', { headers }),
      ]);

      const adminAuthRejected = Boolean(
        pass && [pRes, gRes, mRes].some((response) => response.status === 401),
      );
      if (adminAuthRejected) clearAdminSession();

      const freshData: PublicCache = {};

      if (pRes.ok) {
        const pData = (await pRes.json()) as Profile;
        if (pData) {
          const profileData = adminAuthRejected ? sanitizeProfileForCache(pData) : pData;
          setProfile(profileData);
          freshData.profile = profileData;
        }
      }
      if (projRes.ok) {
        const projData = (await projRes.json()) as Project[];
        if (Array.isArray(projData)) {
          setProjects(projData);
          freshData.projects = projData;
        }
      }
      if (tRes.ok) {
        const tData = (await tRes.json()) as Thought[];
        if (Array.isArray(tData)) {
          setThoughts(tData);
          freshData.thoughts = tData;
        }
      }
      if (sRes.ok) {
        const sData = (await sRes.json()) as Skill[];
        if (Array.isArray(sData)) {
          setSkills(sData);
          freshData.skills = sData;
        }
      }
      if (gRes.ok) {
        const gData = (await gRes.json()) as GuestbookEntry[];
        if (Array.isArray(gData)) {
          const visibleEntries = adminAuthRejected ? gData.filter((entry) => entry.approved) : gData;
          setGuestbook(visibleEntries);
          freshData.guestbook = visibleEntries;
        }
      }
      if (mRes.ok && !adminAuthRejected) {
        const mData = (await mRes.json()) as ContactMessage[];
        if (Array.isArray(mData)) setMessages(mData);
      } else if (!pass || adminAuthRejected) {
        setMessages([]);
      }

      saveCache(freshData);
    } catch (err) {
      console.error('Error fetching data from API:', err);
    }
  };

  useEffect(() => {
    const refresh = window.setTimeout(() => void fetchAllData(), 0);
    return () => window.clearTimeout(refresh);
    // Initial public page data should load once on mount; admin login and edits
    // explicitly refresh with their in-memory passcode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll only while the authenticated admin panel is open. This keeps the inbox
  // and moderation queue fresh without exposing owner-only data publicly or
  // forcing a full document reload.
  useEffect(() => {
    if (!isAdminOpen || !adminPasscode) return;

    let cancelled = false;
    let requestInFlight = false;

    const refreshAdminActivity = async () => {
      if (requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;

      try {
        const headers = { 'X-Admin-Auth': adminPasscode };
        const [guestbookResponse, messagesResponse] = await Promise.all([
          fetch('/api/guestbook', { headers }),
          fetch('/api/messages', { headers }),
        ]);

        if (cancelled) return;

        if (guestbookResponse.status === 401 || messagesResponse.status === 401) {
          setAdminPasscode(null);
          setMessages([]);
          setGuestbook((current) => current.filter((entry) => entry.approved));
          setProfile((current) => current ? { ...current, email: '' } : current);
          return;
        }

        if (guestbookResponse.ok) {
          const entries = await guestbookResponse.json() as GuestbookEntry[];
          if (!cancelled && Array.isArray(entries)) setGuestbook(entries);
        }

        if (messagesResponse.ok) {
          const inbox = await messagesResponse.json() as ContactMessage[];
          if (!cancelled && Array.isArray(inbox)) setMessages(inbox);
        }
      } catch (error) {
        if (!cancelled) console.error('Error refreshing admin activity:', error);
      } finally {
        requestInFlight = false;
      }
    };

    const initialRefresh = window.setTimeout(() => void refreshAdminActivity(), 0);
    const interval = window.setInterval(() => void refreshAdminActivity(), 8_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshAdminActivity();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [isAdminOpen, adminPasscode, setAdminPasscode]);

  const adminRequest = async (url: string, options: RequestInit = {}) => {
    if (!adminPasscode) throw new Error('Admin session expired. Please enter the passcode again.');

    const headers = new Headers(options.headers);
    headers.set('X-Admin-Auth', adminPasscode);
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      clearAdminSession();
      throw new Error('Admin session expired. Please enter the passcode again.');
    }

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json() as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // Keep the safe status-based message if the response has no JSON body.
      }
      throw new Error(message);
    }

    return response;
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    const res = await adminRequest('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json() as Profile;
    setProfile(data);
    await fetchAllData();
  };

  const handleSaveProject = async (project: Partial<Project>) => {
    const { id, ...projectFields } = project;
    // Project GET rows include immutable metadata such as created_at. Never
    // send fetched row metadata back through the writable project API.
    const editableFields: Exclude<keyof Project, 'id' | 'created_at'>[] = [
      'title', 'slug', 'subtitle', 'description', 'category', 'tags',
      'image_url', 'live_url', 'github_url', 'metrics', 'featured', 'display_order',
    ];
    const payload = Object.fromEntries(
      editableFields
        .filter((key) => projectFields[key] !== undefined)
        .map((key) => [key, projectFields[key]]),
    );

    await adminRequest('/api/projects', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    });
    await fetchAllData();
  };

  const handleDeleteProject = async (id: number) => {
    await adminRequest('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchAllData();
  };

  const handleSaveThought = async (thought: Partial<Thought>) => {
    const response = await adminRequest('/api/thoughts', {
      method: thought.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thought),
    });
    const savedThought = await response.json() as Thought;
    setThoughts((current) => thought.id
      ? current.map((item) => item.id === savedThought.id ? savedThought : item)
      : [savedThought, ...current]);
    await fetchAllData();
  };

  const handleLikeThought = async (id: number) => {
    const res = await fetch('/api/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', id }),
    });
    if (res.ok) {
      const updated = await res.json() as Thought;
      setThoughts((prev) => prev.map((thought) => thought.id === id ? updated : thought));
    }
  };

  const handleDeleteThought = async (id: number) => {
    await adminRequest('/api/thoughts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchAllData();
  };

  const handleSaveSkill = async (skill: Partial<Skill>) => {
    await adminRequest('/api/skills', {
      method: skill.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });
    await fetchAllData();
  };

  const handleDeleteSkill = async (id: number) => {
    await adminRequest('/api/skills', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchAllData();
  };

  const handleAddGuestbook = async (entry: { name: string; message: string; avatar_color: string; badge: string }) => {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      throw new Error('Guestbook submission failed. Please try again.');
    }
    await res.json();
    // New entries stay off the public feed until owner approval.
  };

  const handleDeleteGuestbook = async (id: number) => {
    await adminRequest('/api/guestbook', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setGuestbook((prev) => prev.filter((entry) => entry.id !== id));
    saveCache({ profile, projects, thoughts, skills, guestbook: guestbook.filter((entry) => entry.id !== id) });
  };

  const handleApproveGuestbook = async (id: number) => {
    const res = await adminRequest('/api/guestbook', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: true }),
    });
    const updated = await res.json() as GuestbookEntry;
    setGuestbook((prev) => prev.map((entry) => entry.id === id ? updated : entry));
    saveCache({ profile, projects, thoughts, skills, guestbook: guestbook.map((entry) => entry.id === id ? updated : entry) });
  };

  const handleSendMessage = async (msg: { sender_name: string; sender_email: string; subject: string; body: string }) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      const newMsg = await res.json() as ContactMessage;
      setMessages((prev) => [newMsg, ...prev]);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    await adminRequest('/api/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };

  const scrollToContact = () => {
    const contactElem = document.querySelector('#contact');
    if (contactElem) contactElem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <Navbar activeSection={activeSection} />

      <Hero profile={profile} onOpenContact={scrollToContact} />

      <ProjectsSection projects={projects} />

      <NowSection profile={profile} />

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
          onApproveGuestbook={handleApproveGuestbook}
          onDeleteMessage={handleDeleteMessage}
          onAdminVerified={async (passcode) => {
            setAdminPasscode(passcode);
            await fetchAllData(passcode);
          }}
          onClose={() => {
            setIsAdminOpen(false);
            clearAdminSession();
          }}
        />
      )}
    </div>
  );
}
