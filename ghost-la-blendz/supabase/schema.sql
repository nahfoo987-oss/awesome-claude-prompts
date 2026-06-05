-- Ghost LA Blendz — Database Schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Appointments table
create table if not exists public.appointments (
  id          uuid default gen_random_uuid() primary key,
  customer_name  text not null,
  customer_phone text not null,
  customer_email text,
  service     text not null default 'Any Cut — $30',
  date        date not null,
  time        text not null,
  notes       text,
  status      text not null default 'pending'
                check (status in ('pending','approved','declined','completed','cancelled')),
  created_at  timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.appointments enable row level security;

-- Policy: anyone can insert (public booking)
create policy "Anyone can book" on public.appointments
  for insert with check (true);

-- Policy: only authenticated admin can read
create policy "Admin reads all" on public.appointments
  for select using (auth.role() = 'authenticated');

-- Policy: only authenticated admin can update
create policy "Admin updates all" on public.appointments
  for update using (auth.role() = 'authenticated');

-- Useful index for calendar lookups
create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists appointments_status_idx on public.appointments (status);

-- View for available slot checking (public)
-- Used by the booking form to show booked times per date
create or replace view public.booked_slots as
  select date, time
  from public.appointments
  where status in ('pending', 'approved');

-- Grant public read on the booked_slots view
grant select on public.booked_slots to anon;
grant select on public.booked_slots to authenticated;

-- Grant insert on appointments to anonymous users
grant insert on public.appointments to anon;

-- Grant all on appointments to authenticated users (admin)
grant all on public.appointments to authenticated;
