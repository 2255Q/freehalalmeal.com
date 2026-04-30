-- =============================================================================
-- FreeHalalMeal.com — initial schema
-- =============================================================================
-- Tables: restaurants, locations, menu_items, vouchers, redemption_log, blocked_emails
-- Auth: uses Supabase auth.users for restaurant owners and admins
-- RLS: enabled everywhere; restaurants only see/edit their own data
-- =============================================================================

-- Helpful extensions
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ----------------------------------------------------------------------------
-- restaurants
-- A restaurant business. One row per restaurant; the auth.users row is the owner.
-- ----------------------------------------------------------------------------
create table public.restaurants (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  slug         text not null unique,
  name         text not null,
  description  text,
  cuisine      text,                -- e.g. "Mediterranean", "Pakistani"
  logo_url     text,
  cover_url    text,
  website      text,
  phone        text,
  email        citext not null,
  status       text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.restaurants (owner_id);
create index on public.restaurants (status);

-- ----------------------------------------------------------------------------
-- locations
-- A restaurant can have multiple physical locations.
-- ----------------------------------------------------------------------------
create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  label           text not null,        -- "Downtown", "Westside", etc.
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  region          text,                  -- state/province
  postal_code     text,
  country         text not null,         -- ISO-3166 alpha-2
  latitude        double precision,
  longitude       double precision,
  phone           text,
  -- daily meal cap & time window (per location)
  daily_meal_limit  integer not null default 10 check (daily_meal_limit >= 0),
  available_from    time   not null default '11:00',
  available_until   time   not null default '20:00',
  -- which days of week meals are available (0 = Sun .. 6 = Sat)
  available_days  integer[] not null default '{0,1,2,3,4,5,6}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.locations (restaurant_id);
create index on public.locations (city);
create index on public.locations (country);

-- ----------------------------------------------------------------------------
-- menu_items
-- The specific dishes a restaurant offers as a free meal.
-- ----------------------------------------------------------------------------
create table public.menu_items (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  name            text not null,
  description     text,
  image_url       text,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index on public.menu_items (restaurant_id);

-- ----------------------------------------------------------------------------
-- vouchers
-- A claim from a member of the public. Single-use, expires.
-- ----------------------------------------------------------------------------
create table public.vouchers (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,        -- short human-readable, e.g. "HAL-9XK4-7M2"
  email           citext not null,
  ip_address      inet,
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete set null,
  menu_item_id    uuid references public.menu_items(id) on delete set null,
  menu_item_name  text not null,                -- snapshot at issue time
  status          text not null default 'issued' check (status in ('issued', 'redeemed', 'expired', 'voided')),
  issued_at       timestamptz not null default now(),
  expires_at      timestamptz not null,
  redeemed_at     timestamptz,
  redeemed_by     uuid references auth.users(id) on delete set null,
  notes           text
);
create index on public.vouchers (email);
create index on public.vouchers (restaurant_id);
create index on public.vouchers (status);
create index on public.vouchers (expires_at);
-- Cast at UTC to keep the expression IMMUTABLE (required by Postgres for index expressions).
-- This means "one per email per restaurant per UTC calendar day" — close enough to "per day"
-- for abuse-prevention purposes.
create unique index vouchers_one_per_email_per_restaurant_per_day
  on public.vouchers (email, restaurant_id, ((issued_at at time zone 'UTC')::date))
  where status in ('issued', 'redeemed');

-- ----------------------------------------------------------------------------
-- blocked_emails / blocked_ips — abuse control
-- ----------------------------------------------------------------------------
create table public.blocked_emails (
  email      citext primary key,
  reason     text,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null
);

create table public.blocked_ips (
  ip         inet primary key,
  reason     text,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null
);

-- ----------------------------------------------------------------------------
-- admins — explicit allow-list of admin user emails
-- ----------------------------------------------------------------------------
create table public.admins (
  email      citext primary key,
  added_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();
create trigger locations_touch before update on public.locations
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- helper: is_admin(uid)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid) returns boolean
  language sql stable security definer as $$
  select exists(
    select 1
    from public.admins a
    join auth.users u on u.email = a.email
    where u.id = uid
  );
$$;

-- ----------------------------------------------------------------------------
-- helper: meals_served_total — for the live counter on the homepage
-- ----------------------------------------------------------------------------
create or replace function public.meals_served_total() returns bigint
  language sql stable as $$
  select count(*)::bigint from public.vouchers where status = 'redeemed';
$$;

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
alter table public.restaurants     enable row level security;
alter table public.locations       enable row level security;
alter table public.menu_items      enable row level security;
alter table public.vouchers        enable row level security;
alter table public.blocked_emails  enable row level security;
alter table public.blocked_ips     enable row level security;
alter table public.admins          enable row level security;

-- Public read: anyone can see ACTIVE restaurants/locations/menu items
create policy "public read active restaurants" on public.restaurants
  for select using (status = 'active');

create policy "public read active locations" on public.locations
  for select using (
    is_active = true
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
  );

create policy "public read active menu items" on public.menu_items
  for select using (
    is_active = true
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
  );

-- Owners: full control over their own restaurant + children
create policy "owner read own restaurant" on public.restaurants
  for select using (auth.uid() = owner_id);
create policy "owner update own restaurant" on public.restaurants
  for update using (auth.uid() = owner_id);
create policy "owner insert own restaurant" on public.restaurants
  for insert with check (auth.uid() = owner_id);

create policy "owner manage own locations" on public.locations
  for all using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

create policy "owner manage own menu items" on public.menu_items
  for all using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

-- Vouchers: owner can see vouchers for their restaurant, admins see all
create policy "owner read own vouchers" on public.vouchers
  for select using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );
create policy "owner update own vouchers" on public.vouchers
  for update using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  );

-- Admin override: full access via is_admin()
create policy "admin all restaurants"     on public.restaurants    for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all locations"       on public.locations      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all menu_items"      on public.menu_items     for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all vouchers"        on public.vouchers       for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all blocked_emails"  on public.blocked_emails for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all blocked_ips"     on public.blocked_ips    for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin all admins"          on public.admins         for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
