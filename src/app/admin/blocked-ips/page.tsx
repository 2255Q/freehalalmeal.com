import { createClient, createServiceClient } from '@/lib/supabase/server';
import { addBlockedIp, removeBlockedIp } from '../actions';

export const dynamic = 'force-dynamic';

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminBlockedIpsPage() {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('blocked_ips')
    .select('ip, reason, blocked_at, blocked_by')
    .order('blocked_at', { ascending: false })
    .limit(500);

  const svc = createServiceClient();
  const blockedByMap = new Map<string, string>();
  const userIds = Array.from(
    new Set(((rows ?? []).map((r) => r.blocked_by).filter(Boolean)) as string[]),
  );
  await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data } = await svc.auth.admin.getUserById(id);
        if (data?.user?.email) blockedByMap.set(id, data.user.email);
      } catch {
        /* ignore */
      }
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">Blocked IPs</h1>
        <p className="text-sm text-ink-500">
          IPs on this list cannot claim vouchers. {rows?.length ?? 0} entries.
        </p>
      </header>

      <form action={addBlockedIp} className="card p-4 grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3">
        <div>
          <label className="label" htmlFor="ip">IP address</label>
          <input
            id="ip"
            name="ip"
            type="text"
            required
            placeholder="e.g. 203.0.113.42 or 2001:db8::1"
            className="input py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="label" htmlFor="reason">Reason (optional)</label>
          <input
            id="reason"
            name="reason"
            type="text"
            placeholder="e.g. abuse, scraping"
            className="input py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary text-sm w-full sm:w-auto">
            Block IP
          </button>
        </div>
      </form>

      {error && (
        <div className="card p-4 text-sm text-red-700">Failed to load: {error.message}</div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1.4fr_1fr_1fr_0.8fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
          <span>IP</span>
          <span>Reason</span>
          <span>Blocked at</span>
          <span>Blocked by</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-ink-100">
          {(rows ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">No IPs are currently blocked.</div>
          )}
          {(rows ?? []).map((r) => (
            <div
              key={String(r.ip)}
              className="md:grid md:grid-cols-[1.4fr_1.4fr_1fr_1fr_0.8fr] md:gap-2 md:items-center p-4 md:px-4 md:py-3 text-sm flex flex-col gap-2"
            >
              <span className="text-ink-800 font-mono truncate">{String(r.ip)}</span>
              <span className="text-ink-600 truncate">{r.reason ?? '—'}</span>
              <span className="text-xs text-ink-500">{formatDate(r.blocked_at)}</span>
              <span className="text-xs text-ink-500 truncate">
                {r.blocked_by ? blockedByMap.get(r.blocked_by) ?? '(unknown)' : '—'}
              </span>
              <form action={removeBlockedIp}>
                <input type="hidden" name="ip" value={String(r.ip)} />
                <button className="text-xs px-2.5 py-1 rounded-full border border-ink-200 bg-white text-ink-700 hover:bg-ink-50">
                  Unblock
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
