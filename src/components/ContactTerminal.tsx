import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Terminal, Send, Copy, Instagram } from 'lucide-react';
import { sanitizeInput } from '../lib/crypto';
import { Toaster, ToasterType } from './Toaster';

interface ContactTerminalProps {
  email?: string;
  onSendMessage: (msg: { sender_name: string; sender_email: string; subject: string; body: string }) => Promise<void>;
}

export const ContactTerminal: React.FC<ContactTerminalProps> = ({ email, onSendMessage }) => {
  const { bgAccentClass, textAccentClass, playSound } = useTheme();

  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState('');
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

  const closeToaster = () => setToaster(prev => ({ ...prev, show: false }));

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

  return (
    <>
      <Toaster
        show={toaster.show}
        type={toaster.type}
        title={toaster.title}
        message={toaster.message}
        onClose={closeToaster}
      />

      <section id="contact" className="py-24 bg-zinc-950 border-b-2 border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Info Column */}
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

              <div className="p-6 bg-black border-2 border-zinc-800 space-y-4 font-mono text-xs">
                <div className="text-zinc-400 font-bold uppercase">// DIRECT CONTACT ADDRESS</div>
                <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800">
                  <span className="font-bold text-white tracking-wider">{email || 'hello@muteeb.in'}</span>
                  <button
                    onClick={handleCopyEmail}
                    className={`px-3 py-1.5 ${bgAccentClass} font-black text-[10px] uppercase flex items-center gap-1`}
                  >
                    <Copy className="w-3 h-3" />
                    COPY
                  </button>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400 font-bold uppercase">INSTAGRAM:</span>
                  <a
                    href="https://instagram.com/mr_muteeb_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-bold uppercase ${textAccentClass} hover:underline flex items-center gap-1`}
                  >
                    <Instagram className="w-3.5 h-3.5" /> @mr_muteeb_
                  </a>
                </div>
              </div>
            </div>

            {/* Form Column - Neo-Brutalist Terminal */}
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

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className={`w-full py-4 ${bgAccentClass} font-black text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110`}
                  >
                    <Send className="w-4 h-4" />
                    {status === 'sending' ? 'TRANSMITTING...' : 'SEND DIRECT MESSAGE'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
