-- ============================================================
-- AgentCal — Initial Schema
-- All timestamps are stored in UTC (timestamptz).
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── businesses ─────────────────────────────────────────────

create table if not exists businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'UTC',  -- IANA timezone name (display only — storage is UTC)
  created_at  timestamptz not null default now()
);

comment on table businesses is 'Top-level tenant — all other entities belong to a business.';

-- ─── staff ──────────────────────────────────────────────────

create table if not exists staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  email        text not null,
  role         text not null default 'employee',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (business_id, email)
);

create index if not exists idx_staff_business on staff(business_id);

-- ─── rooms ──────────────────────────────────────────────────

create table if not exists rooms (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  capacity     integer not null default 1 check (capacity > 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists idx_rooms_business on rooms(business_id);

-- ─── appointments ───────────────────────────────────────────

create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  staff_id     uuid references staff(id) on delete set null,
  room_id      uuid references rooms(id) on delete set null,
  title        text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  status       appointment_status not null default 'confirmed',
  metadata     jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- start must be before end
  constraint chk_time_order check (start_time < end_time),

  -- at least one of staff or room must be set
  constraint chk_requires_resource check (staff_id is not null or room_id is not null)
);

-- Indexes for conflict queries (the key pattern: WHERE start_time < $end AND end_time > $start)
create index if not exists idx_appt_business_time     on appointments(business_id, start_time, end_time);
create index if not exists idx_appt_staff_time        on appointments(staff_id, start_time, end_time) where staff_id is not null;
create index if not exists idx_appt_room_time         on appointments(room_id, start_time, end_time) where room_id is not null;
create index if not exists idx_appt_status            on appointments(status);

-- auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_appointments_updated_at on appointments;
create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();
