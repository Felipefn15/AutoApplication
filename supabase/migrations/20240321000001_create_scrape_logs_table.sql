create table if not exists public.scrape_logs (
  id uuid primary key default gen_random_uuid(),
  jobs_found integer not null,
  jobs_added integer not null,
  created_at timestamp with time zone default now()
);

-- Add RLS policies
alter table public.scrape_logs enable row level security;

create policy "Scrape logs are viewable by everyone"
  on public.scrape_logs for select
  using (true);

create policy "Scrape logs are insertable by authenticated users"
  on public.scrape_logs for insert
  with check (auth.role() = 'authenticated'); 