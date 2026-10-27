import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Terminal } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';
import { FormStatus, type FormStatusMessage } from './FormStatus';
import { GridBackground } from './ui/grid-background';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { StatefulButton, type StatefulButtonStatus } from './ui/stateful-button';

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
  'w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink outline-none transition-all duration-300 placeholder:text-ink-3/60 focus:border-accent/60 ';

export const ContactTerminal: React.FC<ContactTerminalProps> = ({ email, onSendMessage }) => {
  const { playSound } = useTheme();

  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<StatefulButtonStatus>('idle');
  const [lastSentTime, setLastSentTime] = useState(0);

  const [formStatus, setFormStatus] = useState<FormStatusMessage | null>(null);
  const [pingStatus, setPingStatus] = useState<FormStatusMessage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !senderEmail.trim() || !body.trim()) {
      setFormStatus({ type: 'error', title: 'INCOMPLETE ENTRY', message: 'Please fill in your name, email and message.' });
      return;
    }

    const now = Date.now();
    if (now - lastSentTime < 60000) {
      setFormStatus({ type: 'warning', title: 'RATE LIMITED', message: 'Please wait 60 seconds between messages.' });
      return;
    }

    try {
      setFormStatus(null);
      setStatus('loading');
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
      setStatus('success');
      setFormStatus({ type: 'success', title: 'MESSAGE TRANSMITTED', message: 'Thanks for reaching out! I will respond soon.' });
      window.setTimeout(() => setStatus('idle'), 1400);
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus('error');
      setFormStatus({ type: 'error', title: 'TRANSMISSION FAILED', message: 'Something went wrong. Please try again in a moment.' });
      window.setTimeout(() => setStatus('idle'), 1400);
    }
  };

  const handleQuickVanishSubmit = (value: string) => {
    const clean = sanitizeInput(value, 1000).trim();

    if (!clean) {
      setPingStatus({ type: 'warning', title: 'EMPTY PING', message: 'Type something first — then watch it vanish.' });
      return;
    }

    playSound('submit');
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${clean}` : clean));
    setPingStatus({
      type: 'success',
      title: 'PING STAGED',
      message: 'Dropped into the message field — add your name + email and hit send.',
    });
  };

  return (
    <>
      <section id="contact" className="relative overflow-hidden border-b border-line bg-canvas py-24 sm:py-28">
        <GridBackground cellSize={40} maskFrom="center" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* info column */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  {'// direct line'}
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
                  Let&apos;s <span className="text-accent">connect</span>
                </h2>
              </div>

              <TextGenerateEffect
                words="Have a project in mind or a quick note? Send it my way."
                className="max-w-md font-sans text-[15px] leading-relaxed text-ink-3"
                stagger={0.04}
              />

            </div>

            {/* form column — terminal */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="liquid-glass group relative overflow-hidden rounded-2xl"
              >
                <div className="relative flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                      contact form
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                </div>

                {/* strip under window chrome */}
                <div className="space-y-3 border-b border-line bg-surface-2/40 px-5 py-4 sm:px-7">
                  <div className="font-mono text-[11px] text-ink-3">
                    <span className="text-accent">$</span> ./vanish-input --into message
                  </div>
                  <PlaceholdersAndVanishInput
                    placeholders={[
                      'Say hello…',
                      "Let's collaborate on…",
                      'Quick idea for muteeb.in…',
                      'Ping me about…',
                    ]}
                    onSubmit={handleQuickVanishSubmit}
                  />
                  <FormStatus status={pingStatus} />
                  <p className="font-sans text-[11.5px] leading-relaxed text-ink-3">
                    Type anything and hit submit — it explodes, then lands in the message field ready to send.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-4 p-5 sm:p-7">
                  <div className="font-mono text-[11px] text-ink-3">
                    <span className="text-accent">$</span> ./send-message
                  </div>

                  <FormStatus status={formStatus} />

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
                        onChange={(e) => {
                          setName(e.target.value);
                          setFormStatus(null);
                        }}
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
                        onChange={(e) => {
                          setSenderEmail(e.target.value);
                          setFormStatus(null);
                        }}
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
                      onChange={(e) => {
                        setBody(e.target.value);
                        setFormStatus(null);
                      }}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <StatefulButton
                    type="submit"
                    status={status}
                    idleContent="send direct message"
                    loadingContent="transmitting…"
                    successContent="message sent"
                    errorContent="failed — try again"
                    className="py-4"
                  />
                </form>
              </motion.div>
            </div>
          </div>

          <div className="mt-8 flex justify-start border-t border-line pt-5 sm:justify-end">
            <a
              href={`mailto:${email || 'hello@muteeb.in'}`}
              onClick={() => playSound('click')}
              className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-ink-2 transition-colors hover:text-accent"
            >
              <Mail className="h-4 w-4 text-accent" />
              {email || 'hello@muteeb.in'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
