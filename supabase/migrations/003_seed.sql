-- ============================================================
-- AgentCal — Seed Data (development only)
-- ============================================================

-- ─── Business ────────────────────────────────────────────────

insert into businesses (id, name, timezone)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Demo Clinic',
  'America/New_York'
) on conflict (id) do nothing;

-- ─── Staff ───────────────────────────────────────────────────

insert into staff (id, business_id, name, email, role)
values
  ('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Ana García',   'ana.garcia@democlinic.com',  'doctor'),
  ('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Carlos López', 'carlos.lopez@democlinic.com', 'doctor'),
  ('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Laura Martínez',   'laura.martinez@democlinic.com', 'nurse')
on conflict (business_id, email) do nothing;

-- ─── Rooms ───────────────────────────────────────────────────

insert into rooms (id, business_id, name, capacity)
values
  ('c1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Consultation Room A', 2),
  ('c1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Consultation Room B', 2),
  ('c1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Waiting Room',        10)
on conflict (business_id, name) do nothing;

-- ─── Sample Appointments ─────────────────────────────────────

insert into appointments (business_id, staff_id, room_id, title, start_time, end_time, status)
values
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Annual Check-up — Patient 001',
    '2026-04-01T13:00:00Z',
    '2026-04-01T13:30:00Z',
    'confirmed'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Follow-up Consultation — Patient 002',
    '2026-04-01T14:00:00Z',
    '2026-04-01T14:30:00Z',
    'confirmed'
  )
on conflict do nothing;
