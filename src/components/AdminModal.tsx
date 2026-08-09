import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Project, Thought, ContactMessage, GuestbookEntry, Skill } from '../types';
import { Shield, Lock, Save, Plus, Trash2, Download, ShieldAlert, Check, AlertTriangle, Upload } from 'lucide-react';
import { hashPasscode, sanitizeInput } from '../lib/crypto';
import { uploadImage } from '../lib/imageUpload';

interface AdminModalProps {
  profile: Profile | null;
  projects: Project[];
  thoughts: Thought[];
  skills: Skill[];
  messages: ContactMessage[];
  guestbook: GuestbookEntry[];
  onUpdateProfile: (data: Partial<Profile>) => Promise<void>;
  onSaveProject: (project: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onSaveThought: (thought: Partial<Thought>) => Promise<void>;
  onDeleteThought: (id: number) => Promise<void>;
  onSaveSkill: (skill: Partial<Skill>) => Promise<void>;
  onDeleteSkill: (id: number) => Promise<void>;
  onDeleteGuestbook: (id: number) => Promise<void>;
  onDeleteMessage: (id: number) => Promise<void>;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  profile,
  projects,
  thoughts,
  skills,
  messages,
  guestbook,
  onUpdateProfile,
  onSaveProject,
  onDeleteProject,
  onSaveThought,
  onDeleteThought,
  onSaveSkill,
  onDeleteSkill,
  onDeleteGuestbook,
  onDeleteMessage,
  onClose,
}) => {
  const { bgAccentClass, borderAccentClass, textAccentClass, playSound } = useTheme();
  const { isAdmin, setIsAdmin } = useAuth();

  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'typewriter' | 'now_facts' | 'projects' | 'skills' | 'thoughts' | 'messages' | 'guestbook' | 'backup'
  >('profile');

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('__sec_failed_attempts') || 0);
    } catch { return 0; }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('__sec_lockout_until') || 0);
    } catch { return 0; }
  });

  const [timeRemainingText, setTimeRemainingText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const isLockedOut = Date.now() < lockoutUntil;

  useEffect(() => {
    if (!isLockedOut) return;
    const interval = setInterval(() => {
      const remainingMs = lockoutUntil - Date.now();
      if (remainingMs <= 0) {
        setFailedAttempts(0);
        setLockoutUntil(0);
        localStorage.removeItem('__sec_failed_attempts');
        localStorage.removeItem('__sec_lockout_until');
        clearInterval(interval);
      } else {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setTimeRemainingText(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, lockoutUntil]);

  const getStoredPasscode = (): string => {
    try {
      return (
        localStorage.getItem('__admin_custom_passcode') ||
        sessionStorage.getItem('__admin_custom_passcode') ||
        profile?.admin_passcode ||
        ''
      );
    } catch {
      return profile?.admin_passcode || '';
    }
  };

  const currentPasscode = getStoredPasscode();
  const [newPasscode, setNewPasscode] = useState(currentPasscode);
  const [confirmPasscode, setConfirmPasscode] = useState(currentPasscode);
  const [passcodeSuccessMsg, setPasscodeSuccessMsg] = useState('');
  const [passcodeErrorMsg, setPasscodeErrorMsg] = useState('');

  const [profName, setProfName] = useState(profile?.full_name || 'BABA MUTEEB');
  const [profTitle, setProfTitle] = useState(profile?.title || 'STUDENT, DEVELOPER & MAKER');
  const [profBio, setProfBio] = useState(profile?.bio || '');
  const [profStatus, setProfStatus] = useState(profile?.status_badge || 'A CURIOUS MIND WITH RESTLESS HANDS');
  const [profLoc, setProfLoc] = useState(profile?.location || 'MUTEEB.IN // PERSONAL SPACE');
  const [profEmail, setProfEmail] = useState(profile?.email || 'hello@muteeb.in');
  const [profInstagram, setProfInstagram] = useState(profile?.instagram_handle || '@mr_muteeb_');
  const [profLogoUrl, setProfLogoUrl] = useState(profile?.logo_url || '/images/logo.png');
  const [profSaving, setProfSaving] = useState(false);

  const defaultRoles = profile?.typewriter_roles || [
    'STUDENT & NIGHT CODER',
    'MAKER OF INTERNET THINGS',
    'CLEAN UI EXPERIMENTER',
    'PROBLEM SOLVER',
    'CURIOSITY DRIVEN BUILDER'
  ];
  const [roles, setRoles] = useState<string[]>(defaultRoles);
  const [newRoleInput, setNewRoleInput] = useState('');

  const defaultNow = profile?.now_focus || [
    { title: 'LEARNING', desc: 'Getting deep into the tricky parts of JavaScript — promises, closures, and async engine.' },
    { title: 'BUILDING', desc: 'Small digital tools that fix highly specific annoyances I have.' },
    { title: 'READING', desc: 'Mostly technical documentation and web design blogs. MDN is my evening reading.' },
    { title: 'THINKING', desc: 'About why certain websites feel instantly comfortable to use.' }
  ];
  const [nowFocus, setNowFocus] = useState(defaultNow);

  const defaultFacts = profile?.quick_facts || [
    'I run on tea, not coffee',
    "Can't write code in silence",
    'Know 4 languages, master of none',
    'Midnight is my most productive hour'
  ];
  const [quickFacts, setQuickFacts] = useState<string[]>(defaultFacts);
  const [newFactInput, setNewFactInput] = useState('');

  const [editingProj, setEditingProj] = useState<Partial<Project> | null>(null);
  const [editingThought, setEditingThought] = useState<Partial<Thought> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  const [messageSearch, setMessageSearch] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      alert(`SECURITY LOCKOUT ENFORCED: 5 FAILED ATTEMPTS. ACCESS BLOCKED FOR ${timeRemainingText}`);
      return;
    }

    const entered = password.trim();
    const activePass = getStoredPasscode();

    const enteredHash = await hashPasscode(entered);
    const activeHash = activePass ? await hashPasscode(activePass) : '';

    if (
      (activePass && entered === activePass) ||
      (profile?.admin_passcode && entered === profile.admin_passcode) ||
      (activeHash && enteredHash === activeHash)
    ) {
      setIsAdmin(true);
      setAuthError(false);
      setFailedAttempts(0);
      localStorage.removeItem('__sec_failed_attempts');
      localStorage.removeItem('__sec_lockout_until');
      playSound('submit');
    } else {
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);
      localStorage.setItem('__sec_failed_attempts', String(newFailed));

      if (newFailed >= 5) {
        const lockoutTime = Date.now() + 24 * 60 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('__sec_lockout_until', String(lockoutTime));
      }
      setAuthError(true);
      playSound('toggle');
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeErrorMsg('');
    setPasscodeSuccessMsg('');

    if (newPasscode !== confirmPasscode) {
      setPasscodeErrorMsg('PASSCODES DO NOT MATCH. PLEASE CONFIRM YOUR NEW PASSCODE.');
      playSound('toggle');
      return;
    }

    try {
      setProfSaving(true);
      playSound('submit');

      const cleanPass = newPasscode.trim();
      if (cleanPass) {
        try {
          localStorage.setItem('__admin_custom_passcode', cleanPass);
          sessionStorage.setItem('__admin_custom_passcode', cleanPass);
          setPasscodeSuccessMsg(`PASSCODE UPDATED SUCCESSFULLY`);
          setTimeout(() => setPasscodeSuccessMsg(''), 4000);
        } catch (e) {
          console.error(e);
        }
      }

      await onUpdateProfile({
        full_name: sanitizeInput(profName, 60),
        title: sanitizeInput(profTitle, 80),
        bio: sanitizeInput(profBio, 1000),
        status_badge: sanitizeInput(profStatus, 80),
        location: sanitizeInput(profLoc, 80),
        email: sanitizeInput(profEmail, 80),
        instagram_handle: sanitizeInput(profInstagram, 40),
        logo_url: sanitizeInput(profLogoUrl, 200),
        typewriter_roles: roles.map(r => sanitizeInput(r, 60)),
        now_focus: nowFocus.map(item => ({ title: sanitizeInput(item.title, 40), desc: sanitizeInput(item.desc, 300) })),
        quick_facts: quickFacts.map(f => sanitizeInput(f, 100)),
        admin_passcode: cleanPass,
      });
      alert('SETTINGS SAVED SUCCESSFULLY!');
    } catch (err) {
      console.error(err);
      alert('SETTINGS SAVED LOCALLY!');
    } finally {
      setProfSaving(false);
    }
  };

  const handleAddRole = () => {
    if (!newRoleInput.trim()) return;
    setRoles([...roles, sanitizeInput(newRoleInput, 60)]);
    setNewRoleInput('');
    playSound('click');
  };

  const handleRemoveRole = (idx: number) => {
    setRoles(roles.filter((_, i) => i !== idx));
    playSound('click');
  };

  const handleAddFact = () => {
    if (!newFactInput.trim()) return;
    setQuickFacts([...quickFacts, sanitizeInput(newFactInput, 100)]);
    setNewFactInput('');
    playSound('click');
  };

  const handleRemoveFact = (idx: number) => {
    setQuickFacts(quickFacts.filter((_, i) => i !== idx));
    playSound('click');
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    folder: string = 'general'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadImage(file, folder);
      setter(url);
      playSound('submit');
    } catch (err) {
      console.error(err);
      alert('IMAGE UPLOAD FAILED. TRY AGAIN.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProj || !editingProj.title) return;
    try {
      playSound('submit');
      await onSaveProject({
        ...editingProj,
        title: sanitizeInput(editingProj.title || '', 80),
        category: sanitizeInput(editingProj.category || 'PERSONAL', 40),
        description: sanitizeInput(editingProj.description || '', 1000),
        image_url: sanitizeInput(editingProj.image_url || '', 500),
      });
      setEditingProj(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleThoughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThought || !editingThought.title) return;
    try {
      playSound('submit');
      await onSaveThought({
        ...editingThought,
        title: sanitizeInput(editingThought.title || '', 100),
        summary: sanitizeInput(editingThought.summary || '', 300),
        content: sanitizeInput(editingThought.content || '', 5000),
      });
      setEditingThought(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !editingSkill.name) return;
    try {
      playSound('submit');
      await onSaveSkill({
        ...editingSkill,
        name: sanitizeInput(editingSkill.name || '', 50),
        category: sanitizeInput(editingSkill.category || 'LANGUAGES & TOOLS', 40),
      });
      setEditingSkill(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportBackup = () => {
    playSound('submit');
    const data = {
      profile,
      projects,
      thoughts,
      skills,
      guestbook,
      messages,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muteeb_in_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
      <div className="bg-zinc-950 border-2 border-white max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 font-mono text-zinc-200 shadow-2xl relative">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${textAccentClass}`} />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              ADMIN
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-white hover:bg-white hover:text-black font-bold uppercase text-xs"
          >
            [CLOSE X]
          </button>
        </div>

        {!isAdmin ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-6">
            <Lock className="w-12 h-12 text-zinc-500 mx-auto" />
            <div>
              <h3 className="text-lg font-black text-white uppercase mb-1">OWNER AUTHENTICATION REQUIRED</h3>
            </div>

            {isLockedOut ? (
              <div className="p-6 bg-rose-950 border-2 border-rose-500 space-y-3 text-rose-200">
                <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-black uppercase text-white">
                  SECURITY LOCKOUT ENFORCED
                </h4>
                <p className="text-xs font-bold leading-relaxed">
                  5 INCORRECT PASSCODE ATTEMPTS DETECTED. ADMIN STUDIO BLOCKED FOR 24 HOURS TO PROTECT WEBSITE DATA.
                </p>
                <div className="p-3 bg-black border border-rose-500 font-mono text-sm font-black text-rose-400">
                  REMAINING LOCKOUT: {timeRemainingText}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="ENTER ADMIN PASSCODE"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white text-xs font-bold text-center focus:outline-none focus:border-white"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-rose-950 border border-rose-500 text-rose-300 text-xs font-bold uppercase">
                    INCORRECT PASSWORD ({Math.max(0, 5 - failedAttempts)} REMAINING)
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 ${bgAccentClass} font-black text-xs uppercase`}
                >
                  LOGIN
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b-2 border-zinc-800 pb-3">
              {[
                { id: 'profile', name: 'PROFILE & BRANDING' },
                { id: 'typewriter', name: 'TICKER ROLES' },
                { id: 'now_facts', name: '"NOW" & FACTS' },
                { id: 'projects', name: `PROJECTS (${projects.length})` },
                { id: 'skills', name: `THINGS I USE (${skills.length})` },
                { id: 'thoughts', name: `WRITINGS (${thoughts.length})` },
                { id: 'messages', name: `INBOX (${messages.length})` },
                { id: 'guestbook', name: `GUESTBOOK (${guestbook.length})` },
                { id: 'backup', name: 'BACKUP / DATA' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id as any); playSound('click'); }}
                  className={`px-3 py-2 font-bold text-xs uppercase border transition-all ${
                    activeTab === t.id
                      ? `${bgAccentClass} ${borderAccentClass}`
                      : 'border-zinc-800 bg-black text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">DISPLAY NAME</label>
                    <input type="text" maxLength={60} value={profName} onChange={(e) => setProfName(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">ROLE / SUBTITLE</label>
                    <input type="text" maxLength={80} value={profTitle} onChange={(e) => setProfTitle(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">STATUS BADGE TEXT</label>
                    <input type="text" maxLength={80} value={profStatus} onChange={(e) => setProfStatus(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">LOCATION / DOMAIN TAG</label>
                    <input type="text" maxLength={80} value={profLoc} onChange={(e) => setProfLoc(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">EMAIL ADDRESS</label>
                    <input type="email" maxLength={80} value={profEmail} onChange={(e) => setProfEmail(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">INSTAGRAM HANDLE</label>
                    <input type="text" maxLength={40} value={profInstagram} onChange={(e) => setProfInstagram(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">NAV LOGO IMAGE</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" maxLength={500} value={profLogoUrl} onChange={(e) => setProfLogoUrl(e.target.value)} className="flex-1 px-3 py-2 bg-black border border-zinc-800 text-white text-xs" placeholder="Image URL or upload below" />
                    <label className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-700 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      {uploadingImage ? 'UPLOADING...' : 'UPLOAD'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleImageUpload(e, setProfLogoUrl, 'logo')} />
                    </label>
                    {profLogoUrl && <img src={profLogoUrl} className="w-10 h-10 object-cover border border-zinc-700" alt="preview" />}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">SHORT ABOUT PARAGRAPH</label>
                  <textarea rows={4} maxLength={1000} value={profBio} onChange={(e) => setProfBio(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase">// SECURITY PASSCODE CONTROL</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">NEW ADMIN PASSCODE</label>
                      <input type="password" maxLength={50} placeholder="ENTER NEW PASSCODE" value={newPasscode} onChange={(e) => { setNewPasscode(e.target.value); setPasscodeErrorMsg(''); }} className="w-full px-3 py-2 bg-black border border-zinc-700 text-white text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">CONFIRM NEW ADMIN PASSCODE</label>
                      <input type="password" maxLength={50} placeholder="CONFIRM NEW PASSCODE" value={confirmPasscode} onChange={(e) => { setConfirmPasscode(e.target.value); setPasscodeErrorMsg(''); }} className="w-full px-3 py-2 bg-black border border-zinc-700 text-white text-xs font-bold" />
                    </div>
                  </div>

                  {passcodeErrorMsg && (
                    <div className="p-2 bg-rose-950 border border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {passcodeErrorMsg}
                    </div>
                  )}

                  {passcodeSuccessMsg && (
                    <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 shrink-0" /> {passcodeSuccessMsg}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={profSaving} className={`px-6 py-3 ${bgAccentClass} font-black text-xs uppercase flex items-center gap-2`}>
                  <Save className="w-4 h-4" />
                  {profSaving ? 'SAVING...' : 'SAVE ALL BRANDING & PASSCODE SETTINGS'}
                </button>
              </form>
            )}

            {activeTab === 'typewriter' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase mb-1">// HERO TICKER ROLES MANAGER</h3>
                  <p className="text-xs text-zinc-400">Add or edit the dynamic typewriter phrases displayed on the hero banner.</p>
                </div>

                <div className="flex gap-2">
                  <input type="text" maxLength={60} placeholder="Add new role (e.g. OPEN SOURCE EXPLORER)" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)} className="flex-1 px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                  <button type="button" onClick={handleAddRole} className={`px-4 py-2 ${bgAccentClass} font-bold text-xs uppercase flex items-center gap-1`}>
                    <Plus className="w-4 h-4" /> ADD ROLE
                  </button>
                </div>

                <div className="space-y-2">
                  {roles.map((role, idx) => (
                    <div key={idx} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-white uppercase">{role}</span>
                      <button onClick={() => handleRemoveRole(idx)} className="p-1 bg-rose-950 text-rose-300 hover:bg-rose-900" title="Remove role">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={handleSaveProfileSubmit} className={`px-6 py-3 ${bgAccentClass} font-black text-xs uppercase flex items-center gap-2`}>
                  <Save className="w-4 h-4" /> SAVE TICKER ROLES TO DATABASE
                </button>
              </div>
            )}

            {activeTab === 'now_facts' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase">// "NOW" CARDS MANAGER</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nowFocus.map((item, idx) => (
                      <div key={idx} className="p-4 bg-black border border-zinc-800 space-y-2">
                        <input type="text" maxLength={40} value={item.title} onChange={(e) => { const updated = [...nowFocus]; updated[idx].title = e.target.value; setNowFocus(updated); }} className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 font-bold text-white text-xs uppercase" />
                        <textarea rows={2} maxLength={300} value={item.desc} onChange={(e) => { const updated = [...nowFocus]; updated[idx].desc = e.target.value; setNowFocus(updated); }} className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-xs font-bold text-white uppercase">// QUICK FACTS TRIVIA MANAGER</h3>
                  <div className="flex gap-2">
                    <input type="text" maxLength={100} placeholder="Add new quick fact" value={newFactInput} onChange={(e) => setNewFactInput(e.target.value)} className="flex-1 px-3 py-2 bg-black border border-zinc-800 text-white text-xs" />
                    <button type="button" onClick={handleAddFact} className={`px-4 py-2 ${bgAccentClass} font-bold text-xs uppercase flex items-center gap-1`}>
                      <Plus className="w-4 h-4" /> ADD FACT
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickFacts.map((fact, idx) => (
                      <div key={idx} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-200">{fact}</span>
                        <button onClick={() => handleRemoveFact(idx)} className="p-1 bg-rose-950 text-rose-300 hover:bg-rose-900">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveProfileSubmit} className={`px-6 py-3 ${bgAccentClass} font-black text-xs uppercase flex items-center gap-2`}>
                  <Save className="w-4 h-4" /> SAVE NOW & QUICK FACTS TO DATABASE
                </button>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">MANAGE PERSONAL PROJECTS</h3>
                  <button onClick={() => setEditingProj({ title: '', category: 'PERSONAL', tags: ['HTML', 'CSS', 'JS'], featured: true })} className={`px-3 py-1.5 ${bgAccentClass} font-bold text-xs uppercase flex items-center gap-1`}>
                    <Plus className="w-4 h-4" /> ADD NEW PROJECT
                  </button>
                </div>

                {editingProj && (
                  <form onSubmit={handleProjectSubmit} className="p-4 bg-black border-2 border-zinc-700 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase border-b border-zinc-800 pb-2">
                      {editingProj.id ? 'EDIT PROJECT' : 'CREATE NEW PROJECT'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" maxLength={80} placeholder="Project Title" required value={editingProj.title || ''} onChange={(e) => setEditingProj({ ...editingProj, title: e.target.value })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                      <input type="text" maxLength={40} placeholder="Category" value={editingProj.category || ''} onChange={(e) => setEditingProj({ ...editingProj, category: e.target.value })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                    </div>
                    <textarea placeholder="Project description" rows={3} maxLength={1000} value={editingProj.description || ''} onChange={(e) => setEditingProj({ ...editingProj, description: e.target.value })} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">PROJECT IMAGE</label>
                      <div className="flex gap-2 items-center">
                        <input type="text" maxLength={500} placeholder="Image URL or upload" value={editingProj.image_url || ''} onChange={(e) => setEditingProj({ ...editingProj, image_url: e.target.value })} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                        <label className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-700 flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {uploadingImage ? 'UPLOADING...' : 'UPLOAD'}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleImageUpload(e, (url) => setEditingProj({ ...editingProj, image_url: url }), 'projects')} />
                        </label>
                        {editingProj.image_url && <img src={editingProj.image_url} className="w-12 h-12 object-cover border border-zinc-700" alt="preview" />}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingProj(null)} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase">CANCEL</button>
                      <button type="submit" className={`px-4 py-1.5 ${bgAccentClass} font-black text-xs uppercase`}>SAVE PROJECT</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {projects.map((p) => (
                    <div key={p.id} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white uppercase">{p.title}</span>
                        <span className="text-zinc-500 ml-2">[{p.category}]</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingProj(p)} className="px-2 py-1 bg-zinc-900 text-zinc-300 hover:text-white">EDIT</button>
                        <button onClick={() => onDeleteProject(p.id)} className="px-2 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900">DELETE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">MANAGE THINGS I USE</h3>
                  <button onClick={() => setEditingSkill({ name: '', category: 'LANGUAGES & TOOLS', level: 90, display_order: skills.length + 1 })} className={`px-3 py-1.5 ${bgAccentClass} font-bold text-xs uppercase flex items-center gap-1`}>
                    <Plus className="w-4 h-4" /> ADD NEW TOOL
                  </button>
                </div>

                {editingSkill && (
                  <form onSubmit={handleSkillSubmit} className="p-4 bg-black border-2 border-zinc-700 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase border-b border-zinc-800 pb-2">
                      {editingSkill.id ? 'EDIT TOOL' : 'ADD NEW TOOL'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" maxLength={50} placeholder="Tool Name" required value={editingSkill.name || ''} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                      <input type="text" maxLength={40} placeholder="Category" value={editingSkill.category || ''} onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase mb-1">PROFICIENCY LEVEL: {editingSkill.level || 85}%</label>
                      <input type="range" min="10" max="100" value={editingSkill.level || 85} onChange={(e) => setEditingSkill({ ...editingSkill, level: Number(e.target.value) })} className="w-full accent-cyan-400" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingSkill(null)} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase">CANCEL</button>
                      <button type="submit" className={`px-4 py-1.5 ${bgAccentClass} font-black text-xs uppercase`}>SAVE TOOL</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {skills.map((s) => (
                    <div key={s.id || s.name} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white uppercase">{s.name}</span>
                        <span className={`ml-2 font-bold ${textAccentClass}`}>{s.level}%</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSkill(s)} className="px-2 py-1 bg-zinc-900 text-zinc-300 hover:text-white">EDIT</button>
                        <button onClick={() => onDeleteSkill(s.id)} className="px-2 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900">DELETE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'thoughts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">MANAGE WRITINGS & ARTICLES</h3>
                  <button onClick={() => setEditingThought({ title: '', summary: '', content: '', tags: ['PERSONAL'], read_time: '3 MIN READ' })} className={`px-3 py-1.5 ${bgAccentClass} font-bold text-xs uppercase flex items-center gap-1`}>
                    <Plus className="w-4 h-4" /> WRITE NEW ARTICLE
                  </button>
                </div>

                {editingThought && (
                  <form onSubmit={handleThoughtSubmit} className="p-4 bg-black border-2 border-zinc-700 space-y-3">
                    <input type="text" maxLength={100} placeholder="Article Title" required value={editingThought.title || ''} onChange={(e) => setEditingThought({ ...editingThought, title: e.target.value })} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs font-bold" />
                    <textarea placeholder="Short summary" rows={2} maxLength={300} value={editingThought.summary || ''} onChange={(e) => setEditingThought({ ...editingThought, summary: e.target.value })} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                    <textarea placeholder="Full Article Content" rows={6} maxLength={5000} value={editingThought.content || ''} onChange={(e) => setEditingThought({ ...editingThought, content: e.target.value })} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingThought(null)} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase">CANCEL</button>
                      <button type="submit" className={`px-4 py-1.5 ${bgAccentClass} font-black text-xs uppercase`}>SAVE ARTICLE</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {thoughts.map((t) => (
                    <div key={t.id} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="max-w-md">
                        <span className="font-bold text-white uppercase">{t.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingThought(t)} className="px-2 py-1 bg-zinc-900 text-zinc-300 hover:text-white">EDIT</button>
                        <button onClick={() => onDeleteThought(t.id)} className="px-2 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900">DELETE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">INCOMING CONTACT MESSAGES</h3>
                  <input type="text" maxLength={50} placeholder="Search messages" value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} className="px-2 py-1 bg-black border border-zinc-800 text-white text-xs" />
                </div>

                {messages.length === 0 ? (
                  <div className="p-6 text-center border border-zinc-800 text-zinc-500 text-xs">
                    NO MESSAGES RECEIVED YET.
                  </div>
                ) : (
                  messages
                    .filter(m => m.sender_name?.toLowerCase().includes(messageSearch.toLowerCase()) || m.body?.toLowerCase().includes(messageSearch.toLowerCase()))
                    .map((m) => (
                      <div key={m.id} className="p-4 bg-black border border-zinc-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{m.sender_name} ({m.sender_email})</span>
                          <button onClick={() => onDeleteMessage(m.id)} className="px-2 py-0.5 bg-rose-950 text-rose-300 hover:bg-rose-900 text-[10px]">DELETE</button>
                        </div>
                        <div className={`text-xs font-bold ${textAccentClass}`}>{m.subject}</div>
                        <p className="text-xs text-zinc-300 font-sans">{m.body}</p>
                      </div>
                    ))
                )}
              </div>
            )}

            {activeTab === 'guestbook' && (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">MODERATE PUBLIC GUESTBOOK</h3>
                {guestbook.map((g) => (
                  <div key={g.id} className="p-3 bg-black border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{g.name}</span>
                      <span className="text-zinc-500 ml-2">"{g.message}"</span>
                    </div>
                    <button onClick={() => onDeleteGuestbook(g.id)} className="px-2 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900">REMOVE</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase mb-1">// FULL SITE DATABASE BACKUP</h3>
                  <p className="text-xs text-zinc-400">Download a complete JSON snapshot of all site data.</p>
                </div>

                <div className="p-6 bg-black border-2 border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">EXPORT FULL SITE DATA (JSON)</h4>
                    <p className="text-xs text-zinc-500">Includes all DB rows and studio configurations.</p>
                  </div>
                  <button onClick={handleExportBackup} className={`px-6 py-3 ${bgAccentClass} font-black text-xs uppercase flex items-center gap-2`}>
                    <Download className="w-4 h-4" /> EXPORT JSON BACKUP
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
