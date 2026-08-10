import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { GuestbookEntry } from '../types';
import { Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';

interface GuestbookProps {
  entries: GuestbookEntry[];
  onAddEntry: (entry: { name: string; handle: string; message: string; avatar_color: string; badge: string }) => Promise<void>;
}

export const GuestbookSection: React.FC<GuestbookProps> = ({ entries, onAddEntry }) => {
  const { bgAccentClass, borderAccentClass, textAccentClass, playSound } = useTheme();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('VISITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastPostTime, setLastPostTime] = useState(0);

  const badges = ['VISITOR', 'DEVELOPER', 'DESIGNER', 'FRIEND'];
  const colors = ['cyan', 'lime', 'rose', 'purple', 'amber'];

  const publicEntries = entries.filter(e => e.approved === true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const now = Date.now();
    if (now - lastPostTime < 60000) {
      setRateLimited(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setRateLimited(false);
      playSound('submit');
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await onAddEntry({
        name: sanitizeInput(name, 40),
        handle: handle ? (handle.startsWith('@') ? sanitizeInput(handle, 30) : `@${sanitizeInput(handle, 30)}`) : '@guest',
        message: sanitizeInput(message, 300),
        avatar_color: randomColor,
        badge: sanitizeInput(selectedBadge, 20),
      });

      setLastPostTime(Date.now());
      setSubmitted(true);
      setName('');
      setHandle('');
      setMessage('');

      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      console.error('Error posting guestbook entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="guestbook" className="py-24 bg-black border-b-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Guestbook Form Column */}
          <div className="lg:col-span-5">
            <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
              // PUBLIC FEEDBACK TERMINAL
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase font-sans mb-6">
              SIGN THE <span className={`underline decoration-4 ${textAccentClass}`}>GUESTBOOK</span>
            </h2>

            {submitted ? (
              <div className="p-6 bg-emerald-950 border-2 border-emerald-500 space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase">MESSAGE SUBMITTED SUCCESSFULLY!</h3>
                <p className="text-xs text-emerald-200 font-mono leading-relaxed">
                  YOUR MESSAGE HAS BEEN SENT FOR REVIEW. IT WILL APPEAR PUBLICLY ONCE APPROVED BY THE ADMIN. THANK YOU FOR YOUR PATIENCE!
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[10px] font-bold text-emerald-300 hover:text-white underline uppercase"
                >
                  POST ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 bg-zinc-950 border-2 border-zinc-800 space-y-4 font-mono">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    YOUR NAME *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    HANDLE / WEBSITE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="@alexmercer"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    SELECT YOUR ROLE BADGE
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {badges.map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => { setSelectedBadge(b); playSound('click'); }}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-all ${
                          selectedBadge === b
                            ? `${bgAccentClass} ${borderAccentClass}`
                            : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    PUBLIC MESSAGE *
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={300}
                    placeholder="Drop a note, thought, or greeting..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>

                <div className="p-2.5 bg-amber-950/50 border border-amber-800 text-amber-300 text-[10px] font-bold uppercase leading-relaxed">
                  NOTE: ALL MESSAGES ARE REVIEWED BEFORE APPEARING PUBLICLY.
                </div>

                {rateLimited && (
                  <div className="p-3 bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    RATE LIMIT ENFORCED: PLEASE WAIT 60 SECONDS BETWEEN POSTS.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 font-black text-xs uppercase ${bgAccentClass} hover:brightness-110 flex items-center justify-center gap-2`}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'TRANSMITTING...' : 'POST MESSAGE TO FEED'}
                </button>
              </form>
            )}
          </div>

          {/* Entries Feed Column */}
          <div className="lg:col-span-7 space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <div className="font-mono text-xs text-zinc-400 font-bold uppercase mb-2 flex items-center justify-between">
              <span>LIVE VISITOR FEED ({publicEntries.length})</span>
              <span className="text-[10px] text-zinc-400">APPROVED POSTS</span>
            </div>

            {publicEntries.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-zinc-800 bg-zinc-950 font-mono text-zinc-400">
                BE THE FIRST TO SIGN THE GUESTBOOK.
              </div>
            ) : (
              publicEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 bg-zinc-950 border-2 border-zinc-800 hover:border-zinc-600 transition-all font-mono"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 flex items-center justify-center font-black text-black text-xs ${bgAccentClass}`}>
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm uppercase block leading-tight">{entry.name}</span>
                        <span className="text-[10px] text-zinc-400">{entry.handle}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 uppercase">
                      {entry.badge}
                    </span>
                  </div>

                  <p className="text-sm font-sans text-zinc-300 leading-normal pl-9">
                    {entry.message}
                  </p>

                  <div className="mt-3 pt-2 border-t border-zinc-900 text-[10px] text-zinc-400 text-right">
                    {new Date(entry.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
