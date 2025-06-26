import { NextResponse } from 'next/server';
import { scrapeJobs } from '@/lib/scraper';
import { supabase } from '@/lib/supabaseClient';
import type { Job } from '@/types/job';

// This route is called by a cron job every hour
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the last scrape time
    const { data: lastScrape } = await supabase
      .from('scrape_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if it's too soon to scrape again (minimum 1 hour between scrapes)
    if (lastScrape) {
      const lastScrapeTime = new Date(lastScrape.created_at);
      const timeSinceLastScrape = (Date.now() - lastScrapeTime.getTime()) / 1000 / 60;

      if (timeSinceLastScrape < 60) {
        return NextResponse.json({
          message: 'Too soon to scrape again',
          nextScrapeIn: Math.round(60 - timeSinceLastScrape)
        });
      }
    }

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

    // Log the scrape
    const { error: logError } = await supabase
      .from('scrape_logs')
      .insert([{
        jobs_found: jobs.length,
        jobs_added: newJobs.length
      }]);

    if (logError) {
      console.error('Error logging scrape:', logError);
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