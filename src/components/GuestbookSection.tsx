import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { GuestbookEntry } from '../types';
import { BadgeCheck, Send, ShieldAlert } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';
import { Toaster, ToasterType } from './Toaster';
import { GlowingEffect } from './ui/glowing-effect';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface GuestbookProps {
  entries: GuestbookEntry[];
  onAddEntry: (entry: {
    name: string;
    handle: string;
    message: string;
    avatar_color: string;
    badge: string;
  }) => Promise<void>;
}

const AVATAR_STYLES: Record<string, string> = {
  cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  lime: 'border-lime-400/40 bg-lime-400/10 text-lime-300',
  rose: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  purple: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
  amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
};

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink outline-none transition-all duration-300 placeholder:text-ink-3/60 focus:border-accent/60 focus:shadow-[0_0_20px_rgba(34,212,114,0.14)]';

export const GuestbookSection: React.FC<GuestbookProps> = ({ entries, onAddEntry }) => {
  const { playSound } = useTheme();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('VISITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [lastPostTime, setLastPostTime] = useState(0);

  const [toaster, setToaster] = useState<{
    show: boolean;
    type: ToasterType;
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  const badges = ['VISITOR', 'DEVELOPER', 'DESIGNER', 'FRIEND'];
  const colors = ['cyan', 'lime', 'rose', 'purple', 'amber'];

  const publicEntries = entries.filter((e) => e.approved === true);

  const showToaster = (type: ToasterType, title: string, message: string) => {
    setToaster({ show: true, type, title, message });
  };

  const closeToaster = () => setToaster((prev) => ({ ...prev, show: false }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const now = Date.now();
    if (now - lastPostTime < 60000) {
      setRateLimited(true);
      showToaster('warning', 'RATE LIMITED', 'Please wait 60 seconds between posts.');
      return;
    }

    try {
      setIsSubmitting(true);
      setRateLimited(false);
      playSound('submit');
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await onAddEntry({
        name: sanitizeInput(name, 40),
        handle: handle
          ? handle.startsWith('@')
            ? sanitizeInput(handle, 30)
            : `@${sanitizeInput(handle, 30)}`
          : '@guest',
        message: sanitizeInput(message, 300),
        avatar_color: randomColor,
        badge: sanitizeInput(selectedBadge, 20),
      });

      setLastPostTime(Date.now());
      setName('');
      setHandle('');
      setMessage('');

      showToaster('success', 'MESSAGE SUBMITTED', 'Your message is awaiting admin approval.');
    } catch (err) {
      console.error('Error posting guestbook entry:', err);
      showToaster('error', 'SUBMISSION FAILED', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster
        show={toaster.show}
        type={toaster.type}
        title={toaster.title}
        message={toaster.message}
        onClose={closeToaster}
      />

      <section id="guestbook" className="border-b border-line bg-canvas py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* form column */}
            <div className="lg:col-span-5">
              <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                {'// public feedback'}
              </div>
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Sign the{' '}
                <span className="text-glow-accent text-accent">guestbook</span>
              </h2>
              <TextGenerateEffect
                words="Leave a note, a thought, or just proof you were here. Every entry gets a quick moderation pass before it goes live."
                className="mb-8 max-w-md text-sm leading-relaxed text-ink-3"
                stagger={0.035}
              />

              <form
                onSubmit={handleSubmit}
                className="group relative space-y-4 overflow-hidden rounded-2xl border border-line bg-surface p-6"
              >
                <GlowingEffect spread={24} borderRadius={16} />

                <div className="relative">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                    your name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                    handle / website (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="@alexmercer"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                    select your role badge
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {badges.map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => {
                          setSelectedBadge(b);
                          playSound('click');
                        }}
                        className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                          selectedBadge === b
                            ? 'border-accent/60 bg-accent/15 text-accent shadow-[0_0_14px_rgba(34,212,114,0.25)]'
                            : 'border-line bg-canvas text-ink-3 hover:border-line-2 hover:text-ink'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                    public message *
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={300}
                    placeholder="Drop a note, thought, or greeting…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {rateLimited && (
                  <div className="relative flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 p-3 font-mono text-[11px] font-bold text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    rate limit enforced: please wait 60 seconds between posts.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black transition-all duration-300 hover:shadow-[0_0_28px_rgba(34,212,114,0.45)] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'transmitting…' : 'post message to feed'}
                </button>
              </form>
            </div>

            {/* entries feed column */}
            <div className="space-y-4 lg:col-span-7">
              <div className="mb-2 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                  live visitor feed ({publicEntries.length})
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                  approved posts
                </span>
              </div>

              <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
                {publicEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center font-mono text-sm text-ink-3">
                    be the first to sign the guestbook.
                  </div>
                ) : (
                  publicEntries.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.4, delay: Math.min(idx, 5) * 0.05 }}
                      className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-all duration-300 hover:border-line-2"
                    >
                      <GlowingEffect spread={20} borderRadius={16} glow={false} />

                      <div className="relative mb-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs font-bold ${
                              AVATAR_STYLES[entry.avatar_color] || AVATAR_STYLES.cyan
                            }`}
                          >
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-mono text-sm font-bold leading-tight text-ink">
                              {entry.name}
                            </span>
                            <span className="font-mono text-[10px] text-ink-3">
                              {entry.handle}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-ink-2">
                          {entry.badge}
                        </span>
                      </div>

                      <p className="relative pl-[46px] font-sans text-sm leading-relaxed text-ink-2">
                        {entry.message}
                      </p>

                      <div className="relative mt-3 border-t border-line pt-2 text-right font-mono text-[10px] text-ink-3">
                        {new Date(entry.created_at || Date.now()).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
