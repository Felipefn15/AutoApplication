create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  description text not null,
  url text not null unique,
  source text not null,
  posted_at timestamp with time zone not null,
  skills text[] not null default '{}',
  salary text,
  employment_type text,
  experience_level text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster job searches
create index if not exists jobs_url_idx on public.jobs(url);
create index if not exists jobs_posted_at_idx on public.jobs(posted_at desc);
create index if not exists jobs_source_idx on public.jobs(source);

-- Add RLS policies
alter table public.jobs enable row level security;

create policy "Jobs are viewable by everyone"
  on public.jobs for select
  using (true);

create policy "Jobs are insertable by authenticated users"
  on public.jobs for insert
  with check (auth.role() = 'authenticated');

create policy "Jobs are updatable by authenticated users"
  on public.jobs for update
  using (auth.role() = 'authenticated');

-- Create function to update updated_at on row update
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger to update updated_at
create trigger handle_jobs_updated_at
  before update
  on public.jobs
  for each row
  execute function public.handle_updated_at(); 