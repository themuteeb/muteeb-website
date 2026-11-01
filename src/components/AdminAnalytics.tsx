import React, { useCallback, useEffect, useState } from 'react';
import { useThemedDialog } from './ui/themed-dialog';

interface Visitor {
  session_id: string;
  first_seen: string;
  last_seen: string;
  views: number;
  last_path: string;
  referrer: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  device: string;
  browser: string;
}

interface Totals { visits: number; views: number }

interface AnalyticsData {
  generatedAt: string;
  liveUsers: number;
  liveVisitors: Visitor[];
  today: Totals;
  totals: Totals;
  monthly: Array<Totals & { key: string }>;
  yearly: Array<Totals & { key: string }>;
  recentVisitors: Visitor[];
  blockedIps: Array<{ ip: string; reason: string; created_at: string }>;
}

// Live view: refresh every 5 seconds while this tab is visible.
const REFRESH_MS = 5 * 1000;
const fmt = (iso: string | null | undefined) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
};
const place = (v: Visitor) => [v.city, v.region, v.country].filter(Boolean).join(', ') || '—';

const Card: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-black p-3">
    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
    <div className="mt-1 text-2xl font-black text-white">{value}</div>
  </div>
);

export const AdminAnalytics: React.FC<{ passcode: string | null }> = ({ passcode }) => {
  const dialog = useThemedDialog();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const load = useCallback(async () => {
    if (!passcode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', { headers: { 'X-Admin-Auth': passcode } });
      if (!res.ok) throw new Error(res.status === 401 ? 'Session expired. Log in again.' : 'Could not load analytics.');
      setData((await res.json()) as AnalyticsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [passcode]);

  // Block (PUT) or unblock (DELETE) an IP, then refresh the data.
  const changeBlock = async (method: 'PUT' | 'DELETE', ip: string, reason = '') => {
    if (!passcode || actionBusy) return false;
    setActionBusy(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/analytics', {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Auth': passcode },
        body: JSON.stringify(method === 'PUT' ? { ip, reason } : { ip }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || 'Could not update the blocklist.');
      setActionMessage(method === 'PUT' ? `Blocked ${ip}. Takes effect within about a minute.` : `Unblocked ${ip}.`);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the blocklist.');
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  const blockedSet = new Set((data?.blockedIps || []).map((b) => b.ip));

  // One button per visitor: "block" when the IP is free, "unblock" when it is already blocked.
  const toggleVisitorBlock = async (ip: string, isBlocked: boolean) => {
    if (!ip) return;
    if (isBlocked) {
      if (!(await dialog.confirm(`Unblock ${ip}?`))) return;
      void changeBlock('DELETE', ip);
      return;
    }
    if (!(await dialog.confirm(`Block ${ip}? That visitor will be refused the site's data and shown a restricted notice.`))) return;
    void changeBlock('PUT', ip, 'blocked from analytics');
  };

  const submitManualBlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const ip = manualIp.trim();
    if (!ip) return;
    if (!(await dialog.confirm(`Block ${ip}?`))) return;
    if (await changeBlock('PUT', ip, manualReason.trim())) {
      setManualIp('');
      setManualReason('');
    }
  };

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [load]);

  const th = 'px-2 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500';
  const td = 'px-2 py-1.5 align-top text-xs text-zinc-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase text-white">Visitor analytics</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Live = visitors active in the last 3 minutes. Refreshes every 30 seconds.
            {data && ` Updated ${fmt(data.generatedAt)} IST.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-full border border-line bg-black px-3 py-1.5 text-[11px] font-bold uppercase text-zinc-300 disabled:opacity-40"
        >
          {loading ? 'refreshing…' : 'refresh'}
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-950 border border-red-500 text-red-400 text-xs font-bold uppercase">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="Live users now" value={data.liveUsers} />
            <Card label="Visits today" value={data.today.visits} />
            <Card label="Visits all time" value={data.totals.visits} />
            <Card label="Page views all time" value={data.totals.views} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">By month (IST)</div>
              <table className="w-full"><thead><tr><th className={th}>Month</th><th className={th}>Visits</th><th className={th}>Views</th></tr></thead>
                <tbody>{data.monthly.length === 0 && <tr><td className={td} colSpan={3}>No visits yet.</td></tr>}
                  {data.monthly.map((m) => <tr key={m.key} className="border-t border-line"><td className={td}>{m.key}</td><td className={td}>{m.visits}</td><td className={td}>{m.views}</td></tr>)}
                </tbody></table>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">By year (IST)</div>
              <table className="w-full"><thead><tr><th className={th}>Year</th><th className={th}>Visits</th><th className={th}>Views</th></tr></thead>
                <tbody>{data.yearly.length === 0 && <tr><td className={td} colSpan={3}>No visits yet.</td></tr>}
                  {data.yearly.map((y) => <tr key={y.key} className="border-t border-line"><td className={td}>{y.key}</td><td className={td}>{y.visits}</td><td className={td}>{y.views}</td></tr>)}
                </tbody></table>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-black p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Block an IP address ({data.blockedIps.length} blocked)
            </div>
            <form onSubmit={(e) => void submitManualBlock(e)} className="flex flex-wrap items-end gap-2">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">IP address</span>
                <input
                  type="text"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="203.0.113.7"
                  maxLength={45}
                  className="w-56 bg-black border border-line px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-accent"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Reason (optional)</span>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  maxLength={120}
                  className="w-56 bg-black border border-line px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={actionBusy || !manualIp.trim()}
                className="rounded-full border border-red-500/60 bg-red-950/50 px-4 py-2 text-[11px] font-bold uppercase text-red-400 disabled:opacity-40"
              >
                block ip
              </button>
            </form>
            {actionMessage && <p role="status" className="text-xs font-bold uppercase text-emerald-300">{actionMessage}</p>}
            <p className="text-[11px] text-zinc-500">
              Blocked visitors get a restricted-access notice and no site data. Admin logins are never blocked.
              Cached pages can still show for about a minute, and static site files are not IP-filtered.
            </p>
            {data.blockedIps.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[480px]">
                  <thead><tr><th className={th}>IP</th><th className={th}>Reason</th><th className={th}>Blocked</th><th className={th}></th></tr></thead>
                  <tbody>
                    {data.blockedIps.map((b) => (
                      <tr key={b.ip} className="border-t border-line">
                        <td className={`${td} font-mono`}>{b.ip}</td>
                        <td className={td}>{b.reason || '—'}</td>
                        <td className={td}>{fmt(b.created_at)}</td>
                        <td className={td}>
                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => void changeBlock('DELETE', b.ip)}
                            className="rounded-full border border-line bg-black px-3 py-1 text-[10px] font-bold uppercase text-zinc-300 disabled:opacity-40"
                          >
                            unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live now ({data.liveVisitors.length})</div>
            <VisitorTable rows={data.liveVisitors} th={th} td={td} blocked={blockedSet} onToggle={toggleVisitorBlock} busy={actionBusy} />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent visitors (latest {data.recentVisitors.length})</div>
            <VisitorTable rows={data.recentVisitors} th={th} td={td} blocked={blockedSet} onToggle={toggleVisitorBlock} busy={actionBusy} />
          </div>
        </>
      )}
    </div>
  );
};

const VisitorTable: React.FC<{
  rows: Visitor[];
  th: string;
  td: string;
  blocked: Set<string>;
  onToggle: (ip: string, isBlocked: boolean) => void;
  busy: boolean;
}> = ({ rows, th, td, blocked, onToggle, busy }) => (
  <div className="overflow-x-auto rounded-xl border border-line">
    <table className="w-full min-w-[720px]">
      <thead>
        <tr>
          <th className={th}>Action</th><th className={th}>Last seen</th><th className={th}>IP</th><th className={th}>Location</th>
          <th className={th}>Device</th><th className={th}>Browser</th><th className={th}>Page</th>
          <th className={th}>Views</th><th className={th}>From</th><th className={th}>First seen</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td className={td} colSpan={10}>Nobody yet.</td></tr>}
        {rows.map((v) => (
          <tr key={v.session_id} className="border-t border-line">
            <td className={td}>
              {v.ip && (() => {
                const isBlocked = blocked.has(v.ip);
                return (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggle(v.ip, isBlocked)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase disabled:opacity-40 ${
                      isBlocked
                        ? 'border-line bg-black text-zinc-300'
                        : 'border-red-500/60 bg-red-950/50 text-red-400'
                    }`}
                  >
                    {isBlocked ? 'unblock' : 'block'}
                  </button>
                );
              })()}
            </td>
            <td className={td}>{fmt(v.last_seen)}</td>
            <td className={`${td} font-mono`}>{v.ip || '—'}</td>
            <td className={td}>{place(v)}</td>
            <td className={td}>{v.device}</td>
            <td className={td}>{v.browser}</td>
            <td className={td}>{v.last_path}</td>
            <td className={td}>{v.views}</td>
            <td className={td}>{v.referrer || 'direct'}</td>
            <td className={td}>{fmt(v.first_seen)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
