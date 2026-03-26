-- ============================================================
-- AgentCal — Row Level Security (RLS)
-- ============================================================
-- Strategy:
--   • anon / public users: NO access
--   • service_role (admin client): bypasses RLS — used by API routes
--   • authenticated users: can only see data belonging to their business_id
--     (set via app_metadata claim: business_id)
--
-- In MVP, all API routes use the service_role key, so RLS acts as a
-- defense-in-depth safety net rather than primary access control.
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────

alter table businesses    enable row level security;
alter table staff         enable row level security;
alter table rooms         enable row level security;
alter table appointments  enable row level security;

-- ─── Helper: extract business_id from JWT app_metadata ───────

create or replace function auth_business_id()
returns uuid language sql stable as $$
  select nullif(
    (auth.jwt() -> 'app_metadata' ->> 'business_id'),
    ''
  )::uuid;
$$;

-- ─── businesses ──────────────────────────────────────────────

create policy "businesses: owner can read"
  on businesses for select
  using (id = auth_business_id());

-- ─── staff ───────────────────────────────────────────────────

create policy "staff: owner business can read"
  on staff for select
  using (business_id = auth_business_id());

create policy "staff: owner business can insert"
  on staff for insert
  with check (business_id = auth_business_id());

create policy "staff: owner business can update"
  on staff for update
  using (business_id = auth_business_id());

-- ─── rooms ───────────────────────────────────────────────────

create policy "rooms: owner business can read"
  on rooms for select
  using (business_id = auth_business_id());

create policy "rooms: owner business can insert"
  on rooms for insert
  with check (business_id = auth_business_id());

create policy "rooms: owner business can update"
  on rooms for update
  using (business_id = auth_business_id());

-- ─── appointments ────────────────────────────────────────────

create policy "appointments: owner business can read"
  on appointments for select
  using (business_id = auth_business_id());

create policy "appointments: owner business can insert"
  on appointments for insert
  with check (business_id = auth_business_id());

create policy "appointments: owner business can update"
  on appointments for update
  using (business_id = auth_business_id());

create policy "appointments: owner business can delete"
  on appointments for delete
  using (business_id = auth_business_id());
