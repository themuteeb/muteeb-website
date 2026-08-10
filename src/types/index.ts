export interface Profile {
  id?: number;
  full_name: string;
  title: string;
  bio: string;
  status_badge: string;
  location: string;
  available_for_work: boolean;
  accent_color: string;
  email: string;
  instagram_handle?: string;
  headline?: string;
  logo_url?: string;
  sound_enabled?: boolean;
  typewriter_roles?: string[];
  now_focus?: { title: string; desc: string }[];
  quick_facts?: string[];
  admin_passcode?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  image_url: string;
  live_url: string;
  github_url?: string;
  metrics: { [key: string]: string };
  featured: boolean;
  display_order: number;
  created_at?: string;
}

export interface Thought {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  read_time: string;
  likes_count: number;
  published_at: string;
  featured: boolean;
}

export interface GuestbookEntry {
  id: number;
  name: string;
  handle: string;
  message: string;
  avatar_color: string;
  badge: string;
  approved: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  created_at: string;
  read_status: boolean;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  level: number;
  icon?: string;
  display_order: number;
}

export type ThemePreset = 'neon' | 'lime' | 'coral' | 'violet' | 'mono';
