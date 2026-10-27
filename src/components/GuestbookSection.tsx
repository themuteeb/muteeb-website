import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GuestbookEntry } from '../types';
import { BadgeCheck, PenLine, ShieldAlert, User } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';
import { Toaster, ToasterType } from './Toaster';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { CardStack } from './ui/card-stack';
import { AnimatedModal } from './ui/animated-modal';
import { StatefulButton, type StatefulButtonStatus } from './ui/stateful-button';

interface GuestbookProps {
  entries: GuestbookEntry[];
  onAddEntry: (entry: {
    name: string;
    message: string;
    avatar_color: string;
    badge: string;
  }) => Promise<void>;
}

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink outline-none transition-all duration-300 placeholder:text-ink-3/60 focus:border-accent/60';

const AVATAR_STYLES: Record<string, string> = {
  cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  lime: 'border-lime-400/40 bg-lime-400/10 text-lime-300',
  rose: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  purple: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
  amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
};

export const GuestbookSection: React.FC<GuestbookProps> = ({ entries, onAddEntry }) => {
  const { playSound } = useTheme();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('VISITOR');
  const [submitStatus, setSubmitStatus] = useState<StatefulButtonStatus>('idle');
  const [isFormOpen, setIsFormOpen] = useState(false);
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
  const publicEntries = entries.filter((entry) => entry.approved === true);

  const showToaster = (type: ToasterType, title: string, message: string) => {
    setToaster({ show: true, type, title, message });
  };

  const closeToaster = () => setToaster((prev) => ({ ...prev, show: false }));

  const openForm = () => {
    setSubmitStatus('idle');
    setRateLimited(false);
    setIsFormOpen(true);
    playSound('click');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) {
      showToaster('warning', 'INCOMPLETE ENTRY', 'Please add your name and a public message.');
      return;
    }

    const now = Date.now();
    if (now - lastPostTime < 60000) {
      setRateLimited(true);
      showToaster('warning', 'RATE LIMITED', 'Please wait 60 seconds between posts.');
      return;
    }

    try {
      setSubmitStatus('loading');
      setRateLimited(false);
      playSound('submit');
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await onAddEntry({
        name: sanitizeInput(name, 40),
        message: sanitizeInput(message, 300),
        avatar_color: randomColor,
        badge: sanitizeInput(selectedBadge, 20),
      });

      setLastPostTime(Date.now());
      setName('');
      setMessage('');
      setSubmitStatus('success');
      showToaster('success', 'MESSAGE SUBMITTED', 'Your message is awaiting admin approval.');
      window.setTimeout(() => {
        setSubmitStatus('idle');
        setIsFormOpen(false);
      }, 1100);
    } catch (error) {
      console.error('Error posting guestbook entry:', error);
      setSubmitStatus('error');
      showToaster('error', 'SUBMISSION FAILED', 'Something went wrong. Please try again.');
      window.setTimeout(() => setSubmitStatus('idle'), 1600);
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

      <section id="guestbook" className="border-b border-line bg-canvas py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
                {'// public feedback'}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Sign the <span className="text-accent">guestbook</span>
              </h2>
              <TextGenerateEffect
                words="Leave a note or a thought. Entries are reviewed before they appear."
                className="mt-2.5 max-w-md text-sm leading-relaxed text-ink-3"
                stagger={0.035}
              />
            </div>
            <button
              type="button"
              onClick={openForm}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <PenLine className="h-4 w-4" />
              leave a message
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                live visitor feed ({publicEntries.length})
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                approved posts
              </span>
            </div>

            {publicEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center font-mono text-sm text-ink-3">
                be the first to sign the guestbook.
              </div>
            ) : (
              <div className="mx-auto max-w-xl">
                <CardStack
                  items={publicEntries.map((entry) => ({
                    id: entry.id,
                    content: entry.message,
                    name: entry.name,
                    designation: `${entry.badge} · ${entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'approved'}`,
                    avatar: (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${AVATAR_STYLES[entry.avatar_color] || 'border-line bg-zinc-800 text-zinc-400'}`}
                        aria-hidden
                      >
                        <User className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                    ),
                  }))}
                  offset={10}
                  scaleFactor={0.06}
                  className="w-60 sm:w-72 md:w-96"
                />
              </div>
            )}
          </div>
        </div>

        <AnimatedModal
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          labelledBy="guestbook-form-title"
        >
          <div className="pr-8">
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              public feedback
            </div>
            <h2 id="guestbook-form-title" className="text-2xl font-extrabold tracking-tight text-ink">
              Add your name and message
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-ink-3">
              Your entry will appear publicly after it has been approved.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="guestbook-name" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                your name *
              </label>
              <input
                id="guestbook-name"
                type="text"
                required
                maxLength={40}
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                select your role badge
              </label>
              <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                  <button
                    type="button"
                    key={badge}
                    onClick={() => {
                      setSelectedBadge(badge);
                      playSound('click');
                    }}
                    aria-pressed={selectedBadge === badge}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      selectedBadge === badge
                        ? 'border-accent/60 bg-accent/15 text-accent'
                        : 'border-line bg-canvas text-ink-3 hover:border-line-2 hover:text-ink'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="guestbook-message" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                public message *
              </label>
              <textarea
                id="guestbook-message"
                required
                rows={4}
                maxLength={300}
                placeholder="Write a public message…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            {rateLimited && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 p-3 font-mono text-[11px] font-bold text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                rate limit enforced: please wait 60 seconds between posts.
              </div>
            )}

            <StatefulButton
              type="submit"
              status={submitStatus}
              idleContent="post message"
              loadingContent="transmitting…"
              successContent="message sent"
            />
          </form>
        </AnimatedModal>
      </section>
    </>
  );
};
