import type { ThemePreset } from '../types';

export const SITE_SETTINGS_CACHE_KEY = 'muteeb-site-settings';

export type SectionKey = 'now' | 'work' | 'stack' | 'thoughts' | 'guestbook' | 'contact';

export interface SiteSettings {
  siteEnabled: boolean;
  maintenanceMessage: string;
  announcement: string;
  palette: ThemePreset;
  guestbookOpen: boolean;
  sections: Record<SectionKey, boolean>;
}

export const PALETTE_IDS: ThemePreset[] = ['neon', 'white', 'pink', 'violet', 'mono'];
export const SECTION_IDS: SectionKey[] = ['now', 'work', 'stack', 'thoughts', 'guestbook', 'contact'];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteEnabled: true,
  maintenanceMessage: 'The site is being updated. Please check back soon.',
  announcement: '',
  palette: 'neon',
  guestbookOpen: true,
  sections: { now: true, work: true, stack: true, thoughts: true, guestbook: true, contact: true },
};

/** Merge untrusted data (cache or API) over the defaults, keeping only valid fields. */
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof SiteSettings, unknown>>;
  const sectionsSrc = (src.sections && typeof src.sections === 'object' ? src.sections : {}) as Record<string, unknown>;
  const sections = { ...DEFAULT_SITE_SETTINGS.sections };
  for (const key of SECTION_IDS) {
    if (typeof sectionsSrc[key] === 'boolean') sections[key] = sectionsSrc[key] as boolean;
  }
  return {
    siteEnabled: typeof src.siteEnabled === 'boolean' ? src.siteEnabled : DEFAULT_SITE_SETTINGS.siteEnabled,
    maintenanceMessage: typeof src.maintenanceMessage === 'string' ? src.maintenanceMessage : DEFAULT_SITE_SETTINGS.maintenanceMessage,
    announcement: typeof src.announcement === 'string' ? src.announcement : DEFAULT_SITE_SETTINGS.announcement,
    palette: PALETTE_IDS.includes(src.palette as ThemePreset) ? (src.palette as ThemePreset) : DEFAULT_SITE_SETTINGS.palette,
    guestbookOpen: typeof src.guestbookOpen === 'boolean' ? src.guestbookOpen : DEFAULT_SITE_SETTINGS.guestbookOpen,
    sections,
  };
}

export function loadCachedSiteSettings(): SiteSettings {
  try {
    const raw = window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY);
    return raw ? normalizeSiteSettings(JSON.parse(raw)) : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveCachedSiteSettings(settings: SiteSettings) {
  try {
    window.localStorage.setItem(SITE_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable: settings still apply for this page load */
  }
}
