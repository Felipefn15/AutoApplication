-- Create tables for the auto job application agent

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link TEXT NOT NULL,
    email TEXT,
    apply_via_site BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    applied BOOLEAN NOT NULL DEFAULT false,
    applied_at TIMESTAMPTZ
);

-- Create index on jobs created_at for efficient ordering
CREATE INDEX jobs_created_at_idx ON jobs(created_at DESC);

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    resume_url TEXT,
    search_keywords TEXT[] NOT NULL DEFAULT '{}',
    job_types TEXT[] NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{"remote_only": true, "full_time_only": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Application settings table
CREATE TABLE application_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cover_letter_template TEXT NOT NULL,
    email_subject_template TEXT NOT NULL,
    email_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scrape logs table
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobs_found INTEGER NOT NULL,
    jobs_added INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on scrape_logs created_at for efficient ordering
CREATE INDEX scrape_logs_created_at_idx ON scrape_logs(created_at DESC);

-- Insert default application settings
INSERT INTO application_settings (
    cover_letter_template,
    email_subject_template,
    email_signature
) VALUES (
    'Dear Hiring Manager,

I am writing to express my strong interest in the {{position}} position at {{company}}. With my relevant experience and skills, I believe I would be a valuable addition to your team.

I am particularly drawn to this opportunity because it aligns perfectly with my career goals and expertise. I am confident that my background and skills make me an excellent candidate for this role.

I have attached my resume for your review. I would welcome the opportunity to discuss how I can contribute to {{company}} in more detail.

Thank you for considering my application.

Best regards,',
    'Application for {{position}} position at {{company}}',
    'Best regards,
[Your name]
[Your email]
[Your phone number]'
);

-- Create a table for user profiles
CREATE TABLE public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    email text not null unique,
    full_name text,
    resume_url text,
    job_preferences jsonb default '{
        "roles": [],
        "locations": [],
        "remote": true,
        "salary_min": null,
        "salary_max": null,
        "skills": []
    }'::jsonb,
    settings jsonb default '{
        "email_notifications": true,
        "auto_apply": false
    }'::jsonb
);

-- Create a table for jobs
CREATE TABLE public.jobs (
    id uuid default uuid_generate_v4() not null primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    company text not null,
    location text not null,
    description text not null,
    url text not null unique,
    status text not null default 'pending' check (status in ('pending', 'applied', 'rejected', 'interviewing')),
    user_id uuid references public.profiles on delete cascade not null,
    source text not null,
    salary_range text,
    requirements text[],
    benefits text[],
    applied_at timestamp with time zone,
    last_status_change timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$;

-- Create a trigger to create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create guest_sessions table
CREATE TABLE guest_sessions (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null unique,
  resume_data jsonb not null,
  applications_remaining integer not null default 20,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create job_applications table
CREATE TABLE job_applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs(id) on delete cascade,
  session_id text references guest_sessions(session_id) on delete cascade,
  resume_data jsonb not null,
  status text not null default 'submitted',
  applied_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Add indexes for better query performance
CREATE INDEX idx_guest_sessions_session_id ON guest_sessions(session_id);
CREATE INDEX idx_job_applications_session_id ON job_applications(session_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);

-- Add RLS policies for guest_sessions
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guest sessions are viewable by anyone"
  ON guest_sessions FOR SELECT
  USING (true);

CREATE POLICY "Guest sessions are insertable by anyone"
  ON guest_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guest sessions are updatable by session owner"
  ON guest_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add RLS policies for job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job applications are viewable by session owner"
  ON job_applications FOR SELECT
  USING (true);

CREATE POLICY "Job applications are insertable by session owner"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
CREATE TRIGGER update_guest_sessions_updated_at
  BEFORE UPDATE ON guest_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 