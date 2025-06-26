import * as cheerio from 'cheerio';
import type { Job } from '@/types/job';

// Scrape jobs from WeWorkRemotely
async function scrapeWWR(): Promise<Job[]> {
  try {
    const response = await fetch('https://weworkremotely.com/remote-jobs/search?term=');
    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs: Job[] = [];

    $('article.feature, li.feature')
      .slice(0, 20) // Limit to first 20 jobs for now
      .each((_, element) => {
        const $el = $(element);
        const title = $el.find('span.title').text().trim();
        const company = $el.find('span.company').text().trim();
        const location = $el.find('span.region').text().trim() || 'Remote';
        const description = $el.find('div.listing-container').text().trim();
        const url = 'https://weworkremotely.com' + $el.find('a:first').attr('href');
        const posted_at = $el.find('time').attr('datetime') || new Date().toISOString();
        
        // Skip if missing required fields
        if (!title || !company || !description) {
          return;
        }
        
        // Extract skills from job description
        const skills = extractSkills(description);
        
        const job: Job = {
          title,
          company,
          location,
          description,
          url,
          source: 'WeWorkRemotely',
          posted_at: new Date(posted_at).toISOString(),
          skills,
          employment_type: 'Full-time'
        };
        
        jobs.push(job);
      });

    return jobs;
  } catch (error) {
    console.error('Error scraping WeWorkRemotely:', error);
    return [];
  }
}

// Scrape jobs from Remotive
async function scrapeRemotive(): Promise<Job[]> {
  try {
    const response = await fetch('https://remotive.com/api/remote-jobs');
    const data = await response.json();
    
    return data.jobs.slice(0, 20).map((job: any) => {
      const scrapedJob: Job = {
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || 'Remote',
        description: job.description,
        url: job.url,
        source: 'Remotive',
        posted_at: new Date(job.publication_date || Date.now()).toISOString(),
        skills: extractSkills(job.description),
        salary: job.salary || undefined,
        employment_type: job.job_type || 'Full-time',
        experience_level: job.experience_level
      };
      return scrapedJob;
    });
  } catch (error) {
    console.error('Error scraping Remotive:', error);
    return [];
  }
}

// Helper function to extract skills from job description
function extractSkills(description: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'ruby', 'go', 'rust',
    'react', 'vue', 'angular', 'node', 'express', 'django', 'flask',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
    'git', 'ci/cd', 'agile', 'scrum'
  ];
  
  const descLower = description.toLowerCase();
  return commonSkills.filter(skill => descLower.includes(skill));
}

// Main function to scrape jobs from all sources
export async function scrapeJobs(): Promise<Job[]> {
  try {
    const [wwrJobs, remotiveJobs] = await Promise.all([
      scrapeWWR(),
      scrapeRemotive()
    ]);

    return [...wwrJobs, ...remotiveJobs];
  } catch (error) {
    console.error('Error scraping jobs:', error);
    return [];
  }
} 