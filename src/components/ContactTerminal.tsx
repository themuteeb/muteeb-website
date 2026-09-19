import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Copy, Instagram, Send, Terminal } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';
import { Toaster, ToasterType } from './Toaster';
import { GridBackground } from './ui/grid-background';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface ContactTerminalProps {
  email?: string;
  onSendMessage: (msg: {
    sender_name: string;
    sender_email: string;
    subject: string;
    body: string;
  }) => Promise<void>;
}

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink outline-none transition-all duration-300 placeholder:text-ink-3/60 focus:border-accent/60 focus:shadow-[0_0_20px_rgba(34,212,114,0.14)]';

export const ContactTerminal: React.FC<ContactTerminalProps> = ({ email, onSendMessage }) => {
  const { playSound } = useTheme();

  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState('');
  const [quickValue, setQuickValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');
  const [lastSentTime, setLastSentTime] = useState(0);

  const [toaster, setToaster] = useState<{
    show: boolean;
    type: ToasterType;
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  const showToaster = (type: ToasterType, title: string, message: string) => {
    setToaster({ show: true, type, title, message });
  };

  const closeToaster = () => setToaster((prev) => ({ ...prev, show: false }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !senderEmail.trim() || !body.trim()) return;

    const now = Date.now();
    if (now - lastSentTime < 60000) {
      showToaster('warning', 'RATE LIMITED', 'Please wait 60 seconds between messages.');
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
          Accept: 'application/json',
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
      setName('');
      setSenderEmail('');
      setBody('');
      setStatus('idle');
      showToaster('success', 'MESSAGE TRANSMITTED', 'Thanks for reaching out! I will respond soon.');
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus('idle');
      showToaster('error', 'TRANSMISSION FAILED', 'Please try again or copy the direct email.');
    }
  };

  const handleCopyEmail = () => {
    playSound('click');
    navigator.clipboard.writeText(email || 'hello@muteeb.in');
    showToaster('success', 'EMAIL COPIED', `${email || 'hello@muteeb.in'} copied to clipboard.`);
  };

  const handleQuickVanishSubmit = (value: string) => {
    const clean = sanitizeInput(value, 1000).trim();

    if (!clean) {
      showToaster('warning', 'EMPTY PING', 'Type something first — then watch it vanish.');
      return;
    }

    playSound('submit');
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${clean}` : clean));
    showToaster(
      'success',
      'PING STAGED',
      'Dropped into the message field — add your name + email and hit send.'
    );
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

      <section id="contact" className="relative overflow-hidden border-b border-line bg-canvas py-24 sm:py-28">
        <GridBackground cellSize={40} maskFrom="center" glow />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* info column */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  {'// direct line'}
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
                  Let&apos;s connect &<br />
                  <span className="text-glow-accent text-accent">say hello</span>
                </h2>
              </div>

              <TextGenerateEffect
                words="Always happy to connect, collaborate on creative ideas, or talk about software architecture and design systems. Drop a direct note or copy my email."
                className="max-w-md font-sans text-[15px] leading-relaxed text-ink-3"
                stagger={0.04}
              />

              {/* email card */}
              <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6">
                <div className="relative space-y-4 font-mono text-xs">
                  <div className="font-bold uppercase tracking-[0.2em] text-ink-3">
                    {'// contact'}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-3.5">
                    <span className="truncate font-bold tracking-wider text-ink">
                      {email || 'hello@muteeb.in'}
                    </span>
                    <button
                      onClick={handleCopyEmail}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[10px] font-bold uppercase text-black transition-all duration-300 hover:shadow-[0_0_18px_rgba(34,212,114,0.5)]"
                    >
                      <Copy className="h-3 w-3" />
                      copy
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="font-bold uppercase tracking-[0.2em] text-ink-3">
                      instagram
                    </span>
                    <a
                      href="https://instagram.com/mr_muteeb_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-bold uppercase text-accent transition-opacity hover:opacity-70"
                    >
                      <Instagram className="h-3.5 w-3.5" /> @mr_muteeb_
                    </a>
                  </div>
                </div>
              </div>

              {/* quick ping card — vanish input */}
              <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6">
                <div className="relative space-y-4 font-mono text-xs">
                  <div className="font-bold uppercase tracking-[0.2em] text-ink-3">
                    {'// quick ping — try the vanish effect'}
                  </div>

                  <PlaceholdersAndVanishInput
                    placeholders={[
                      'Say hello…',
                      'Let’s collaborate on…',
                      'Quick idea for muteeb.in…',
                      'Ping me about…',
                    ]}
                    value={quickValue}
                    onChange={setQuickValue}
                    onSubmit={handleQuickVanishSubmit}
                  />

                  <p className="font-sans text-[11.5px] leading-relaxed text-ink-3">
                    Type anything and hit submit — it explodes, then lands in the message
                    field ready to send.
                  </p>
                </div>
              </div>
            </div>

            {/* form column — terminal */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]"
              >
                <div className="relative flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                      system_mail_interface.sh
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-4 p-5 sm:p-7">
                  <div className="font-mono text-[11px] text-ink-3">
                    <span className="text-accent">$</span> ./send-message --to{' '}
                    <span className="text-[#f5c97b]">{email || 'hello@muteeb.in'}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                        your name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        placeholder="e.g. Alex Mercer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                        your email *
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={80}
                        placeholder="alex@example.com"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                      message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={1000}
                      placeholder="Write your note or thoughts…"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black transition-all duration-300 hover:shadow-[0_0_32px_rgba(34,212,114,0.5)] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {status === 'sending' ? 'transmitting…' : 'send direct message'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
