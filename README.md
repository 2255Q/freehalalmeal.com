# FreeHalalMeal.com

> A community-powered network of halal restaurants offering free meals to neighbors in need. No questions asked. No barriers — just kindness.

> *Bismillah ir-Rahman ir-Raheem.*
> *In the name of God, the Most Gracious, the Most Merciful.*

## What this is

FreeHalalMeal.com is a free, simple platform that connects halal restaurants with anyone who needs a meal. Restaurants sign up, list their locations and what they're offering, and set a daily cap. Anyone can claim a single-use voucher with just an email — they show it at the counter and eat. No paperwork, no proof required. The platform is operated by a single owner (Al, alaltoum@gmail.com) and is open to community contributions.

## Tech stack

- **[Next.js 14](https://nextjs.org/)** — App Router, Server Components, Server Actions
- **[Supabase](https://supabase.com/)** — Postgres, Auth (magic links), Row-Level Security
- **[Resend](https://resend.com/)** — transactional email for voucher delivery
- **[Vercel](https://vercel.com/)** — hosting + edge functions
- **[Tailwind CSS](https://tailwindcss.com/)** — design system
- **TypeScript** end-to-end

## Getting started locally

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/freehalalmeal.com.git
cd freehalalmeal.com

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Then edit .env.local with your Supabase + Resend keys
# (See DEPLOY.md for how to obtain them.)

# 4. Apply the database schema
# In your Supabase project's SQL editor, paste and run:
#   supabase/migrations/0001_initial_schema.sql

# 5. Run the dev server
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Project structure

```
freehalalmeal.com/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Owner-only admin panel
│   │   ├── partner/              # Restaurant signup / dashboard
│   │   ├── restaurants/          # Public browse / detail
│   │   ├── claim/                # Public voucher claim flow
│   │   ├── about/                # Static pages
│   │   ├── layout.tsx
│   │   └── page.tsx              # Homepage
│   ├── components/               # Header, Footer, RestaurantCard, etc.
│   ├── lib/
│   │   ├── supabase/             # Server + client Supabase factories
│   │   ├── types.ts
│   │   ├── voucher.ts
│   │   ├── email.ts
│   │   └── pdf.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql
├── public/
├── .env.example
├── DEPLOY.md
└── README.md
```

## Scripts

| Command            | What it does                                |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Start the dev server on `localhost:3000`    |
| `npm run build`    | Build for production                        |
| `npm run start`    | Run the production build locally            |
| `npm run lint`     | ESLint                                       |
| `npm run typecheck`| `tsc --noEmit` — strict TypeScript check    |

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for a step-by-step walkthrough — Supabase setup, Resend setup, GitHub, Vercel, DNS, and seeding your admin account. Total cost on free tiers: **$0/month** to start.

## License

Copyright (c) FreeHalalMeal.com. All rights reserved as a project, but the code is open to community contributions — pull requests welcome. If you want to adapt this for a different cause, please reach out at hello@freehalalmeal.com.

## Acknowledgements

To every restaurant owner who feeds someone they don't know. To every developer who lent a free hour. To everyone who clicked "claim" because they were hungry — your dignity is the whole point. *Alhamdulillah.*
