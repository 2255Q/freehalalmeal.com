# Deploying FreeHalalMeal.com

This is a complete walkthrough for taking the project from a fresh clone to a live site at `https://freehalalmeal.com`. It assumes you're comfortable with the terminal and with copy-pasting some keys, but that you've never set up Supabase, Resend, or Vercel before.

## Overview

The whole stack runs on free tiers:

| Service     | What it does                              | Free tier               |
| ----------- | ----------------------------------------- | ----------------------- |
| Vercel      | Hosts the Next.js app                     | 100 GB bandwidth/month  |
| Supabase    | Postgres database + auth + storage        | 500 MB DB, 50k MAU      |
| Resend      | Sends voucher emails                      | 3,000 emails/month      |
| Cloudflare  | Free DNS (optional but recommended)       | Unlimited               |

**Total monthly cost to start: $0.** You'll outgrow these only once you're serving thousands of meals — see "Costs as you grow" at the bottom.

You'll need:

- A GitHub account
- A registered domain (`freehalalmeal.com` in this guide)
- ~30–60 minutes for the first deploy

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**.
   - **Name:** `freehalalmeal`
   - **Database password:** generate a strong one and save it somewhere safe (you'll rarely need it but you can't recover it).
   - **Region:** pick the one closest to your primary users (e.g. `us-east-1` for the US East Coast).
   - **Plan:** Free.
3. Wait ~2 minutes while Supabase provisions Postgres.

### Grab your API keys

Once the project is ready, in the left sidebar click **Project Settings → API**. You'll need three values:

- **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
- **anon / public key** — safe to expose to the browser
- **service_role key** — server-side only. Treat this like a password.

Copy them to a notes file; you'll paste them into Vercel and `.env.local`.

### Apply the schema

In the left sidebar click **SQL Editor → New query**. Open the file `supabase/migrations/0001_initial_schema.sql` from this repo, copy its entire contents, paste into the SQL editor, and click **Run**.

You should see "Success. No rows returned." Verify by clicking **Table Editor** — you should now see `restaurants`, `locations`, `menu_items`, `vouchers`, `blocked_emails`, `blocked_ips`, and `admins`.

### Configure auth

In the left sidebar click **Authentication → Providers** and enable:

- **Email** with **Magic Link / OTP** turned on. Disable "Confirm email" if you want one-step login (recommended for restaurant owners).

Then click **Authentication → URL Configuration**:

- **Site URL:** `https://freehalalmeal.com`
- **Redirect URLs:** add both:
  - `https://freehalalmeal.com/partner/callback`
  - `http://localhost:3000/partner/callback` (for local dev)

Save.

---

## Step 2 — Set up Resend

1. Go to [resend.com](https://resend.com) and create a free account.
2. Click **Domains → Add domain** and enter `freehalalmeal.com`.
3. Resend shows you 3–4 DNS records (SPF, DKIM, optionally DMARC). Keep that page open — you'll add these in Step 5 alongside your Vercel records.
4. Once DNS is set, come back and click **Verify domain**.
5. Click **API Keys → Create API key**. Copy the key (starts with `re_`).
6. Decide on a from-address. Use `vouchers@freehalalmeal.com` — you don't need to set up a real mailbox; Resend handles outbound mail through your verified domain.

If your domain isn't ready yet, you can use Resend's `onboarding@resend.dev` sandbox sender to test. Just remember to switch it before launch.

---

## Step 3 — Push code to GitHub

```bash
cd freehalalmeal.com
git init
git add .
git commit -m "Initial commit"
```

Create a new repo on [github.com](https://github.com/new) called `freehalalmeal.com` (private or public — your call). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/freehalalmeal.com.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**, find your `freehalalmeal.com` repo, click **Import**.
3. Vercel auto-detects Next.js. Leave defaults.
4. Expand **Environment Variables** and add the following. (Check the box "Production, Preview, Development" for each — they're needed everywhere.)

| Key                              | Value                                                            | Notes                                              |
| -------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://xxxxx.supabase.co`                                      | From Supabase → Project Settings → API             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | `eyJhbGc...`                                                     | The "anon" / public key                            |
| `SUPABASE_SERVICE_ROLE_KEY`      | `eyJhbGc...`                                                     | **NEVER** put this in `NEXT_PUBLIC_*`              |
| `RESEND_API_KEY`                 | `re_xxxxxx`                                                      | From Resend → API Keys                             |
| `RESEND_FROM_EMAIL`              | `FreeHalalMeal.com <vouchers@freehalalmeal.com>`                 | Display name + address                             |
| `NEXT_PUBLIC_SITE_URL`           | `https://freehalalmeal.com`                                      | Used in voucher emails / PDF links                 |
| `ADMIN_EMAILS`                   | `alaltoum@gmail.com`                                             | Comma-separated bootstrap admin allow-list         |

5. Click **Deploy**. Wait ~2 minutes. Vercel gives you a `*.vercel.app` URL — open it and click around. The site should load even though no restaurants exist yet.

---

## Step 5 — Connect freehalalmeal.com

In your Vercel project: **Settings → Domains → Add**.

Add both `freehalalmeal.com` and `www.freehalalmeal.com`. Vercel will show you DNS records — typically:

- An `A` record for the apex `@` pointing to `76.76.21.21`
- A `CNAME` for `www` pointing to `cname.vercel-dns.com`

### If you're using Cloudflare for DNS (recommended)

1. Sign up at [cloudflare.com](https://cloudflare.com) (free) and click **Add site**, enter `freehalalmeal.com`.
2. Cloudflare scans your existing DNS and gives you two nameservers (e.g. `ada.ns.cloudflare.com`).
3. Log into your registrar (Namecheap, GoDaddy, etc.) and replace the existing nameservers with the two Cloudflare gave you. This can take 5–60 minutes to propagate.
4. Back in Cloudflare → DNS → Records, add the records Vercel asked for. **Important:** click the orange cloud icon to set it to **DNS only** (gray cloud) for Vercel records. Cloudflare's proxy interferes with Vercel's TLS issuance.
5. Add the Resend SPF/DKIM records here too. Those should also be **DNS only**.

### If you're keeping DNS at your registrar

Just add the records Vercel asked for directly there. The interface varies by provider but it's always under "DNS settings" or similar.

### Verify

Back in Vercel, the domain status should flip from "Invalid Configuration" to "Valid Configuration" within a few minutes. HTTPS is provisioned automatically. Open `https://freehalalmeal.com` — you should see the live site.

---

## Step 6 — Seed your admin

Two ways to do this; either is fine:

**A. Use the bootstrap env var (no SQL needed).** You already set `ADMIN_EMAILS=alaltoum@gmail.com` in Step 4. The `/admin/layout.tsx` file checks that fallback and lets you in even before any rows exist in the `admins` table. This is the simplest path.

**B. Insert a row.** In Supabase → SQL editor:

```sql
insert into admins (email) values ('alaltoum@gmail.com');
```

Either way, the flow is the same:

1. Visit `https://freehalalmeal.com/partner/login` and request a magic link to `alaltoum@gmail.com`.
2. Click the link in your inbox.
3. Visit `https://freehalalmeal.com/admin`. You should see the admin overview.

---

## Step 7 — Test the full flow

Before announcing the site, do an end-to-end test:

1. **Sign up a test restaurant.** Use a separate email (e.g. a Gmail alias `you+restaurant@gmail.com`). Go through `/partner/signup`, then approve it from `/admin`.
2. **Add a location.** Make sure it has a real address, hours, and a daily cap.
3. **Add a menu item.** "Chicken biryani — rice, chicken, side salad."
4. **Claim a voucher.** Open an incognito window, go to the public site, find the restaurant, click "Claim a free meal," and use a third email.
5. **Check inbox + PDF.** The voucher email should arrive within a minute. The PDF should have the QR code and code.
6. **Redeem it.** Log in as the restaurant on `/partner/dashboard` and mark the voucher redeemed. Check that the homepage's "meals served" counter ticks up.

If any step fails, see Troubleshooting below.

---

## Going to production — pre-launch checklist

These are nice-to-haves before you tell people about the site:

- **Privacy + Terms pages** — review with a lawyer (or use a template; iubenda.com is good).
- **Real mailboxes** — set up `hello@freehalalmeal.com` and `noreply@freehalalmeal.com` somewhere (Google Workspace, Fastmail, ImprovMX free aliasing). The from-address only needs DNS verification, but inbound mail does need a real mailbox.
- **Analytics** — Vercel Analytics (free tier) is one click. Plausible or Fathom are paid but privacy-respecting alternatives.
- **Error monitoring** — [Sentry](https://sentry.io) has a generous free tier and a Next.js installer. Optional but recommended.
- **Backups** — Supabase Free includes 7-day automated daily backups. For longer retention, upgrade to Pro ($25/mo) when you're ready.
- **Email deliverability** — make sure SPF, DKIM, and ideally DMARC are set in DNS. Send a test email to [mail-tester.com](https://www.mail-tester.com) and aim for 9+/10.
- **Rate limiting on /claim** — already enforced at the DB level (one voucher per email per restaurant per day). If you want IP-level too, Vercel Edge Middleware or a Supabase Edge Function with a Redis store works.

---

## Costs as you grow

You'll only outgrow these tiers once you're moving real volume:

| Service   | Free tier limit                | When you'd outgrow it           | Next tier                              |
| --------- | ------------------------------ | ------------------------------- | -------------------------------------- |
| Vercel    | 100 GB bandwidth / mo          | ~1M page views                  | Pro: $20/mo (1 TB)                     |
| Supabase  | 500 MB DB, 2 GB bandwidth      | ~100k vouchers + lots of users  | Pro: $25/mo (8 GB DB, 50 GB bw)        |
| Resend    | 3,000 emails / mo              | 100 vouchers/day                | $20/mo for 50k                         |
| Cloudflare| Unlimited DNS + CDN basics     | Almost never                    | N/A                                    |

A reasonable expected steady-state cost when this is a healthy regional project is **~$45–65/month** (Vercel Pro + Supabase Pro + Resend tier 1). You can stay free for surprisingly long.

---

## Troubleshooting

**"Magic link never arrived."**
Check the user's spam folder first. Then in Supabase → Auth → Logs, see if the email actually went out. The free tier has a rate limit (4 emails/hour per address) — for testing, use multiple email addresses.

**"Page works locally but breaks on Vercel."**
Almost always env vars. In Vercel → Settings → Environment Variables, confirm every variable in `.env.example` is present and that you redeployed after adding them. Just changing env vars doesn't redeploy automatically — go to Deployments → ⋯ → Redeploy.

**"RLS policy violation" errors.**
Open the Supabase Studio SQL editor and run the migration again — it's idempotent in dev (you can drop the schema first). Also confirm the user is actually authenticated; an unauthenticated session has `auth.uid()` = null and will be rejected by every owner-scoped policy.

**"DNS hasn't propagated."**
Try [whatsmydns.net](https://www.whatsmydns.net) to see global propagation. If it shows the new value almost everywhere but Vercel still says invalid, give it 30 more minutes. If after an hour the status is still red, double-check you set the Vercel records to "DNS only" in Cloudflare.

**"My emails go to spam."**
Resend's domain verification handles SPF + DKIM. Add a DMARC record too: `v=DMARC1; p=none; rua=mailto:dmarc@freehalalmeal.com`. Run [mail-tester.com](https://www.mail-tester.com) and follow its suggestions until you hit 9+/10.

**"I locked myself out of /admin."**
Two escape hatches: (1) set `ADMIN_EMAILS=youremail@example.com` in Vercel env vars and redeploy — the bootstrap fallback in `/admin/layout.tsx` lets you back in. (2) From Supabase SQL editor, `insert into admins (email) values ('youremail@example.com');`.

**"Restaurant signed up but isn't showing on the public site."**
By design, new restaurants are `pending`. Approve them from `/admin/restaurants` (set status to `active`).

---

If you hit something not covered here, open an issue on the repo or email hello@freehalalmeal.com. Good luck — and may this serve more meals than we ever expected. *Alhamdulillah.*
