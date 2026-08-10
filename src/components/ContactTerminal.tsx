import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Terminal, Send, CheckCircle2, Copy, Instagram, ShieldAlert } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';

interface ContactTerminalProps {
  email?: string;
  instagramHandle?: string;
  onSendMessage: (msg: { sender_name: string; sender_email: string; subject: string; body: string }) => Promise<void>;
}

export const ContactTerminal: React.FC<ContactTerminalProps> = ({ email, instagramHandle, onSendMessage }) => {
  const { bgAccentClass, textAccentClass, playSound } = useTheme();

  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'rate_limited' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !senderEmail.trim() || !body.trim()) return;

    const now = Date.now();
    if (now - lastSentTime < 60000) {
      setStatus('rate_limited');
      return;
    }

    try {
      setStatus('sending');
      playSound('submit');

      const cleanName = sanitizeInput(name, 60);
      const cleanEmail = sanitizeInput(senderEmail, 80);
      const cleanBody = sanitizeInput(body, 1000);
      const autoSubject = 'New message from muteeb.in';

      const web3Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: '0d6b4930-6eab-4420-9e71-5c5523836175',
          name: cleanName,
          email: cleanEmail,
          subject: autoSubject,
          message: cleanBody,
        }),
      });

      if (!web3Response.ok) throw new Error('Web3Forms failed');

      try {
        await onSendMessage({
          sender_name: cleanName,
          sender_email: cleanEmail,
          subject: autoSubject,
          body: cleanBody,
        });
      } catch (dbErr) {
        console.warn('DB save failed but email sent:', dbErr);
      }

      setLastSentTime(Date.now());
      setStatus('success');
      setName('');
      setSenderEmail('');
      setBody('');
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus('error');
    }
  };

  const handleCopyEmail = () => {
    if (!email) return;
    playSound('click');
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanIgHandle = instagramHandle ? instagramHandle.replace('@', '') : '';

  return (
    <section id="contact" className="py-24 bg-zinc-950 border-b-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className={`font-mono text-xs font-bold tracking-widest ${textAccentClass} uppercase mb-2`}>
                // DIRECT COMMUNICATIONS TERMINAL
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase font-sans">
                LET'S CONNECT & <br />
                <span className={`underline decoration-4 ${textAccentClass}`}>SAY HELLO</span>
              </h2>
            </div>

            <p className="text-zinc-300 font-sans text-base leading-relaxed">
              Always happy to connect, collaborate on creative ideas, or chat about software architecture and design systems. Drop a direct note or copy my email address.
            </p>

            {(email || instagramHandle) && (
              <div className="p-6 bg-black border-2 border-zinc-800 space-y-4 font-mono text-xs">
                <div className="text-zinc-400 font-bold uppercase">// DIRECT CONTACT ADDRESS</div>
                {email && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800">
                    <span className="font-bold text-white tracking-wider">{email}</span>
                    <button
                      onClick={handleCopyEmail}
                      className={`px-3 py-1.5 ${bgAccentClass} font-black text-[10px] uppercase flex items-center gap-1`}
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'COPIED!' : 'COPY'}
                    </button>
                  </div>
                )}

                {instagramHandle && (
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-400 font-bold uppercase">INSTAGRAM:</span>
                    <a
                      href={`https://instagram.com/${cleanIgHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-bold uppercase ${textAccentClass} hover:underline flex items-center gap-1`}
                    >
                      <Instagram className="w-3.5 h-3.5" /> {instagramHandle}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="bg-black border-2 border-white p-6 sm:p-8 font-mono shadow-2xl relative">
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className={`w-4 h-4 ${textAccentClass}`} />
                  <span className="text-xs font-black uppercase text-white">SYSTEM_MAIL_INTERFACE.SH</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-rose-500 rounded-full" />
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                </div>
              </div>

              {status === 'success' ? (
                <div className="p-8 text-center bg-zinc-950 border border-emerald-500/50 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-black text-white uppercase">MESSAGE TRANSMITTED SUCCESSFULLY</h3>
                  <p className="text-xs text-zinc-400">
                    Thank you for reaching out! I will respond to your message shortly.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className={`px-6 py-2.5 ${bgAccentClass} font-black text-xs uppercase`}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                        YOUR NAME *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        placeholder="e.g. Alex Mercer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                        YOUR EMAIL *
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={80}
                        placeholder="alex@example.com"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      MESSAGE *
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={1000}
                      placeholder="Write your note or thoughts..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                    />
                  </div>

                  {status === 'rate_limited' && (
                    <div className="p-3 bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      RATE LIMIT ENFORCED: PLEASE WAIT 60 SECONDS BETWEEN MESSAGES.
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="p-3 bg-rose-950 border border-rose-500 text-rose-300 text-xs">
                      TRANSMISSION ERROR. PLEASE TRY AGAIN OR COPY DIRECT EMAIL.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className={`w-full py-4 ${bgAccentClass} font-black text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110`}
                  >
                    <Send className="w-4 h-4" />
                    {status === 'sending' ? 'TRANSMITTING...' : 'SEND DIRECT MESSAGE'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
