import { getAdminClient } from './supabaseClient';
import type { UserProfile } from '@/types';

export interface JobListing {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  source: string;
  source_url: string;
  apply_url?: string;
  posted_at: string;
}

interface WWRJob {
  title: string;
  company_name: string;
  job_type: string;
  description: string;
  url: string;
  published_at: string;
}

interface RemoteOKJob {
  position: string;
  company: string;
  job_type: string;
  description: string;
  id: string;
  url: string;
  date: string;
}

interface GitHubJob {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  url: string;
  created_at: string;
}

async function scrapeWeworkremotely(keywords: string[]): Promise<JobListing[]> {
  try {
    const response = await fetch('https://weworkremotely.com/remote-jobs.json');
    const data = await response.json();
    
    return data.jobs
      .filter((job: WWRJob) => 
        keywords.some(keyword => 
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .map((job: WWRJob) => ({
        title: job.title,
        company: job.company_name,
        location: 'Remote',
        type: job.job_type || 'Full-time',
        description: job.description,
        source: 'WeWorkRemotely',
        source_url: job.url,
        apply_url: job.url,
        posted_at: new Date(job.published_at).toISOString(),
      }));
  } catch (error) {
    console.error('Error scraping WeWorkRemotely:', error);
    return [];
  }
}

async function scrapeRemoteok(keywords: string[]): Promise<JobListing[]> {
  try {
    const response = await fetch('https://remoteok.io/api');
    const data = await response.json();
    
    return data
      .filter((job: RemoteOKJob) => 
        keywords.some(keyword => 
          job.position.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .map((job: RemoteOKJob) => ({
        title: job.position,
        company: job.company,
        location: 'Remote',
        type: job.job_type || 'Full-time',
        description: job.description,
        source: 'RemoteOK',
        source_url: `https://remoteok.io/l/${job.id}`,
        apply_url: job.url,
        posted_at: new Date(job.date).toISOString(),
      }));
  } catch (error) {
    console.error('Error scraping RemoteOK:', error);
    return [];
  }
}

async function scrapeGithub(keywords: string[]): Promise<JobListing[]> {
  try {
    const jobs = await Promise.all(
      keywords.map(async (keyword) => {
        const response = await fetch(
          `https://jobs.github.com/positions.json?description=${encodeURIComponent(keyword)}&location=remote`
        );
        return response.json();
      })
    );

    return jobs.flat().map((job: GitHubJob) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      description: job.description,
      source: 'GitHub',
      source_url: job.url,
      apply_url: job.url,
      posted_at: new Date(job.created_at).toISOString(),
    }));
  } catch (error) {
    console.error('Error scraping GitHub:', error);
    return [];
  }
}

export async function scrapeJobs(profile: UserProfile) {
  const supabase = getAdminClient();
  const keywords = profile.search_keywords;
  const jobTypes = profile.job_types;

  try {
    // Scrape jobs from all sources
    const jobs = await Promise.all([
      scrapeWeworkremotely(keywords),
      scrapeRemoteok(keywords),
      scrapeGithub(keywords),
    ]).then(results => results.flat());

    // Filter jobs based on preferences
    const filteredJobs = jobs.filter(job => {
      // Check if job type matches user preferences
      if (jobTypes.length > 0 && !jobTypes.some(type => 
        job.type.toLowerCase().includes(type.toLowerCase())
      )) {
        return false;
      }

      // Check if job is remote (if remote_only is set)
      if (profile.preferences.remote_only && 
          !job.location.toLowerCase().includes('remote')) {
        return false;
      }

      // Check if job is full-time (if full_time_only is set)
      if (profile.preferences.full_time_only && 
          !job.type.toLowerCase().includes('full-time')) {
        return false;
      }

      return true;
    });

    // Insert jobs into database
    for (const job of filteredJobs) {
      const { error } = await supabase
        .from('jobs')
        .insert([{
          ...job,
          user_id: profile.id,
          created_at: new Date().toISOString(),
          applied: false,
        }]);

      if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('Error inserting job:', error);
      }
    }
  } catch (error) {
    console.error('Error scraping jobs:', error);
  }
} 