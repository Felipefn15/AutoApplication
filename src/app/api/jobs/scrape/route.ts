import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { scrapeJobs } from '@/lib/scraper';
import type { JobListing } from '@/lib/scraper';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface ExistingJob {
  link: string;
}

// Helper function to deduplicate jobs
function deduplicateJobs(jobs: JobListing[], existingJobs: ExistingJob[]): JobListing[] {
  const existingUrls = new Set(existingJobs.map(job => job.link));
  return jobs.filter(job => !existingUrls.has(job.link));
}

async function getSession(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Get the JWT from the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  // Set the access token
  supabase.auth.setSession({
    access_token: authHeader.replace('Bearer ', ''),
    refresh_token: '',
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user } : null;
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to get search preferences
    const supabase = getAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Please set up your profile first' },
        { status: 400 }
      );
    }

    // Start job scraping in the background
    scrapeJobs(profile);

    return NextResponse.json({
      message: 'Job scraping started successfully'
    });

  } catch (error) {
    console.error('Error starting job scrape:', error);
    return NextResponse.json(
      { error: 'Failed to start job scraping' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if it's time to scrape (based on environment variable)
    const intervalMinutes = parseInt(process.env.SCRAPING_INTERVAL_MINUTES || '60', 10);
    const supabase = getAdminClient();

    // Get the last scrape time
    const { data: lastScrape } = await supabase
      .from('scrape_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastScrape) {
      const lastScrapeTime = new Date(lastScrape.created_at);
      const timeSinceLastScrape = (Date.now() - lastScrapeTime.getTime()) / 1000 / 60;

      if (timeSinceLastScrape < intervalMinutes) {
        return NextResponse.json({
          message: 'Too soon to scrape again',
          nextScrapeIn: Math.round(intervalMinutes - timeSinceLastScrape)
        });
      }
    }

    // Scrape jobs from all sources
    const jobs = await scrapeAllSources();

    // Get existing jobs from the last 24 hours to avoid duplicates
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('link')
      .gte('created_at', yesterday);

    // Deduplicate jobs
    const newJobs = deduplicateJobs(jobs, existingJobs || []);

    if (newJobs.length > 0) {
      // Insert new jobs
      const { error: jobsError } = await supabase
        .from('jobs')
        .insert(newJobs.map(job => ({
          ...job,
          applied: false
        })));

      if (jobsError) {
        throw jobsError;
      }
    }

    // Log the scrape
    await supabase
      .from('scrape_logs')
      .insert([{ jobs_found: jobs.length, jobs_added: newJobs.length }]);

    return NextResponse.json({
      message: 'Scraping completed successfully',
      jobsFound: jobs.length,
      newJobsAdded: newJobs.length
    });

  } catch (error) {
    console.error('Error in job scraping:', error);
    return NextResponse.json(
      { error: 'Failed to scrape jobs' },
      { status: 500 }
    );
  }
} 