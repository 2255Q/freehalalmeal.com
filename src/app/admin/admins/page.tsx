import { createClient } from '@/lib/supabase/server';
import { addAdmin, removeAdmin } from '../actions';

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

export default async function AdminAdminsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentEmail = (user?.email ?? '').toLowerCase();

  const { data: rows, error } = await supabase
    .from('admins')
    .select('email, added_at')
    .order('added_at', { ascending: true });

  const bootstrapList = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">Admins</h1>
        <p className="text-sm text-ink-500">
          Anyone on this list can access /admin. {rows?.length ?? 0} admin(s).
        </p>
      </header>

      <form action={addAdmin} className="card p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="label" htmlFor="email">Add an admin</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="trusted@example.com"
            className="input py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary text-sm w-full sm:w-auto">
            Add admin
          </button>
        </div>
      </form>

      {bootstrapList.length > 0 && (
        <div className="card p-4 text-sm bg-accent-50 border-accent-200">
          <p className="font-medium text-accent-700">Bootstrap admins (from ADMIN_EMAILS)</p>
          <p className="text-ink-700 mt-1">
            These emails are granted admin access via the <code>ADMIN_EMAILS</code> environment
            variable, even if they don&apos;t appear in the table below. After seeding the table
            with proper rows you can clear this env var.
          </p>
          <ul className="mt-2 text-ink-700 text-sm font-mono">
            {bootstrapList.map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="card p-4 text-sm text-red-700">Failed to load: {error.message}</div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr] gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-500 bg-ink-50">
          <span>Email</span>
          <span>Added</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-ink-100">
          {(rows ?? []).length === 0 && (
            <div className="p-6 text-sm text-ink-500">
              No admins in the table yet — bootstrap admins (above) still have access.
            </div>
          )}
          {(rows ?? []).map((r) => {
            const isSelf = r.email.toLowerCase() === currentEmail;
            return (
              <div
                key={r.email}
                className="md:grid md:grid-cols-[2fr_1fr_0.8fr] md:gap-2 md:items-center p-4 md:px-4 md:py-3 text-sm flex flex-col gap-2"
              >
                <span className="text-ink-800 font-medium truncate">
                  {r.email}
                  {isSelf && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-medium">
                      you
                    </span>
                  )}
                </span>
                <span className="text-xs text-ink-500">{formatDate(r.added_at)}</span>
                <form action={removeAdmin}>
                  <input type="hidden" name="email" value={r.email} />
                  <button
                    className={`text-xs px-2.5 py-1 rounded-full border bg-white hover:bg-red-50 ${
                      isSelf
                        ? 'border-red-300 text-red-800 font-semibold'
                        : 'border-red-200 text-red-700'
                    }`}
                  >
                    {isSelf ? 'Remove self' : 'Remove'}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      {(rows ?? []).some((r) => r.email.toLowerCase() === currentEmail) && (
        <div className="card p-4 text-xs bg-red-50 border-red-200 text-red-700">
          Heads up: removing <strong>yourself</strong> will revoke your /admin access on the next
          request. Make sure another admin remains, or that <code>ADMIN_EMAILS</code> still lists
          your email.
        </div>
      )}
    </div>
  );
}
