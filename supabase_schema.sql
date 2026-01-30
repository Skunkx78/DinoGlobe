-- Create the 'pins' table
create table public.pins (
  id uuid default gen_random_uuid() primary key,
  discord_id text not null,
  username text not null,
  avatar_url text,
  lat double precision not null,
  lng double precision not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent multiple pins from the same discord user (unless admin logic handles it, but unique constraint is safe)
  constraint pins_discord_id_key unique (discord_id)
);

-- Enable Row Level Security (RLS)
alter table public.pins enable row level security;

-- Policy: Allow everyone to READ pins
create policy "Enable read access for all users" on public.pins
  for select using (true);

-- Policy: Allow Service Role (Server-side) to do EVERYTHING
-- (Policies are skipped by the service role key by default, but explicit is fine or just relying on service role override)
