import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { scrapeJobs } from '@/lib/scraper';
import type { JobListing } from '@/lib/scraper';
import { supabase } from '@/lib/supabaseClient';
import type { Job } from '@/types/job';

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
    // Scrape jobs from multiple sources
    const jobs = await scrapeJobs();

    if (!Array.isArray(jobs)) {
      throw new Error('Scraper did not return an array of jobs');
    }

    // Insert jobs into Supabase
    const { data: existingJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('url');

    if (fetchError) {
      console.error('Error fetching existing jobs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing jobs' },
        { status: 500 }
      );
    }

    const existingUrls = new Set(existingJobs?.map(job => job.url) || []);
    const newJobs = jobs.filter((job: Job) => !existingUrls.has(job.url));

    if (newJobs.length > 0) {
      const { error: insertError } = await supabase
        .from('jobs')
        .insert(newJobs);

      if (insertError) {
        console.error('Error inserting jobs:', insertError);
        return NextResponse.json(
          { error: 'Failed to store jobs' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Jobs scraped successfully',
      totalJobs: jobs.length,
      newJobs: newJobs.length
    });
  } catch (error) {
    console.error('Error in job scraping:', error);
    return NextResponse.json(
      { error: 'Failed to scrape jobs' },
      { status: 500 }
    );
  }
} 