import { scrapeJobs } from '@/lib/scraper';
import type { Job } from '@/types/job';

async function testJobScraping() {
  try {
    console.log('Starting job scraping test...');
    
    const jobs = await scrapeJobs();
    
    if (!Array.isArray(jobs)) {
      throw new Error('Scraper did not return an array of jobs');
    }
    
    console.log(`Successfully scraped ${jobs.length} jobs`);
    console.log('\nSample job:');
    console.log(JSON.stringify(jobs[0], null, 2));
    
    // Verify job structure
    const requiredFields = ['title', 'company', 'location', 'description', 'url', 'source', 'posted_at', 'skills'] as const;
    const job = jobs[0] as Job;
    
    if (!job) {
      console.error('No jobs were scraped');
      return;
    }
    
    const missingFields = requiredFields.filter(field => !job[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
    } else {
      console.log('\nAll required fields are present');
    }
    
    // Check data types
    console.log('\nField types:');
    Object.entries(job).forEach(([key, value]) => {
      console.log(`${key}: ${Array.isArray(value) ? 'array' : typeof value}`);
    });
    
  } catch (error) {
    console.error('Error testing job scraping:', error);
  }
}

testJobScraping(); 