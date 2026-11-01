import React, { useCallback, useEffect, useState } from 'react';

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
}

const REFRESH_MS = 30 * 1000;
const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
const place = (v: Visitor) => [v.city, v.region, v.country].filter(Boolean).join(', ') || '—';

const Card: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-black p-3">
    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
    <div className="mt-1 text-2xl font-black text-white">{value}</div>
  </div>
);

export const AdminAnalytics: React.FC<{ passcode: string | null }> = ({ passcode }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), REFRESH_MS);
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

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live now ({data.liveVisitors.length})</div>
            <VisitorTable rows={data.liveVisitors} th={th} td={td} />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent visitors (latest {data.recentVisitors.length})</div>
            <VisitorTable rows={data.recentVisitors} th={th} td={td} />
          </div>
        </>
      )}
    </div>
  );
};

const VisitorTable: React.FC<{ rows: Visitor[]; th: string; td: string }> = ({ rows, th, td }) => (
  <div className="overflow-x-auto rounded-xl border border-line">
    <table className="w-full min-w-[720px]">
      <thead>
        <tr>
          <th className={th}>Last seen</th><th className={th}>IP</th><th className={th}>Location</th>
          <th className={th}>Device</th><th className={th}>Browser</th><th className={th}>Page</th>
          <th className={th}>Views</th><th className={th}>From</th><th className={th}>First seen</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td className={td} colSpan={9}>Nobody yet.</td></tr>}
        {rows.map((v) => (
          <tr key={v.session_id} className="border-t border-line">
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
