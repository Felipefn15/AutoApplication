import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Configurações
const CONFIG = {
  MAX_JOBS_PER_SOURCE: 50,
  MAX_TOTAL_JOBS: 100,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export interface ScrapeParams {
  keywords?: string[];
  location?: string;
}

export interface Job {
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  requirements?: string[];
  benefits?: string[];
  url: string;
  source: string;
  posted_at: string;
  skills: string[];
  employment_type?: string;
  experience_level?: string;
}

/**
 * Usa LLM para gerar queries de busca otimizadas
 */
async function generateSearchQueries(keywords: string[], location: string): Promise<string[]> {
  // Se tiver múltiplas keywords, use as duas primeiras para maior abrangência
  if (keywords && keywords.length > 1) {
    return [keywords[0], keywords[1]];
  } else if (keywords && keywords.length === 1) {
    return [keywords[0]];
  }
  return ['remote'];
}

/**
 * Função de retry para requests
 */
async function retryFetch(url: string, options: RequestInit = {}, attempts = CONFIG.RETRY_ATTEMPTS): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...(options.headers || {})
      }
    });
    
    if (!response.ok && attempts > 1) {
      console.log(`Retry attempt for ${url}, attempts left: ${attempts - 1}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return retryFetch(url, options, attempts - 1);
    }
    
    return response;
  } catch (error) {
    if (attempts > 1) {
      console.log(`Retry attempt for ${url}, attempts left: ${attempts - 1}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return retryFetch(url, options, attempts - 1);
    }
    throw error;
  }
}

// Scrape jobs from RemoteOK API
async function scrapeRemoteOK(params: ScrapeParams = {}): Promise<Job[]> {
  try {
    const { keywords } = params;
    const queries = keywords && keywords.length > 0 ? keywords : ['remote'];
    const jobs: Job[] = [];

    // Busca para cada query
    for (const query of queries) {
      const url = 'https://remoteok.com/api';
      console.log(`Scraping RemoteOK API: ${url} (query: ${query})`);
      
      const response = await retryFetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`RemoteOK API response not ok: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const queryJobs = (data as any[]).slice(1)
        .filter(job => job.position && 
          (job.position.toLowerCase().includes(query.toLowerCase()) ||
           (job.tags && job.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))))
        )
        .map(job => ({
          title: job.position,
          company: job.company,
          description: job.description || '',
          location: job.location || 'Remote',
          url: job.url,
          source: 'RemoteOK',
          posted_at: job.date || new Date().toISOString(),
          skills: job.tags || [],
          employment_type: job.type || 'Full-time'
        }));

      jobs.push(...queryJobs);
    }

    console.log(`RemoteOK: ${jobs.length} jobs found`);
    return jobs.slice(0, CONFIG.MAX_JOBS_PER_SOURCE);
  } catch (error) {
    console.error('Error scraping RemoteOK:', error);
    return [];
  }
}

// Scrape jobs from WeWorkRemotely RSS
async function scrapeWWRRSS(params: ScrapeParams = {}): Promise<Job[]> {
  try {
    const { keywords } = params;
    const queries = keywords && keywords.length > 0 ? keywords : ['remote'];
    const jobs: Job[] = [];

    // Busca para cada query
    for (const query of queries) {
      const url = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';
      console.log(`Scraping WWR RSS: ${url} (query: ${query})`);
      
      const response = await retryFetch(url, {
        headers: {
          'Accept': 'application/rss+xml'
        }
      });
      
      if (!response.ok) {
        console.error(`WWR RSS response not ok: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      
      $('item').each((_, el) => {
        const title = $(el).find('title').text();
        const description = $(el).find('description').text();
        const link = $(el).find('link').text();
        const pubDate = $(el).find('pubDate').text();
        const companyMatch = description.match(/<strong>(.*?)<\/strong>/);
        const company = companyMatch ? companyMatch[1] : 'Desconhecida';
        
        if (title && (
          title.toLowerCase().includes(query.toLowerCase()) ||
          description.toLowerCase().includes(query.toLowerCase())
        )) {
          jobs.push({
          title,
          company,
          description,
            location: 'Remote',
            url: link,
          source: 'WeWorkRemotely',
            posted_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            skills: [],
          employment_type: 'Full-time'
          });
        }
      });
    }

    console.log(`WWR RSS: ${jobs.length} jobs found`);
    return jobs.slice(0, CONFIG.MAX_JOBS_PER_SOURCE);
  } catch (error) {
    console.error('Error scraping WWR RSS:', error);
    return [];
  }
}

// Scrape jobs from Remotive API
async function scrapeRemotive(params: ScrapeParams = {}): Promise<Job[]> {
  try {
    const { keywords } = params;
    const queries = keywords && keywords.length > 0 ? keywords : ['remote'];
    const jobs: Job[] = [];

    // Busca para cada query
    for (const query of queries) {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${CONFIG.MAX_JOBS_PER_SOURCE}`;
      console.log(`Scraping Remotive: ${url}`);
      
      const response = await retryFetch(url);
      
      if (!response.ok) {
        console.error(`Remotive response not ok: ${response.status}`);
        continue;
      }

    const data = await response.json();
      const queryJobs = data.jobs.map((job: any) => ({
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || 'Remote',
        description: job.description,
        url: job.url,
        source: 'Remotive',
        posted_at: new Date(job.publication_date || Date.now()).toISOString(),
        skills: job.tags || [],
        salary: job.salary || undefined,
        employment_type: job.job_type || 'Full-time',
        experience_level: job.experience_level
      }));

      jobs.push(...queryJobs);
    }

    console.log(`Remotive: ${jobs.length} jobs found`);
    return jobs.slice(0, CONFIG.MAX_JOBS_PER_SOURCE);
  } catch (error) {
    console.error('Error scraping Remotive:', error);
    return [];
  }
}

// Main function to scrape jobs from all sources
export async function scrapeJobs(params: ScrapeParams = {}): Promise<Job[]> {
  try {
    console.log('Starting job scraping with params:', params);
    
    // Gera queries de busca otimizadas
    const searchQueries = await generateSearchQueries(params.keywords || [], params.location || '');
    const queryParams = { ...params, keywords: searchQueries };
    
    // Scrape from all sources in parallel
    const [remoteOKJobs, wwrJobs, remotiveJobs] = await Promise.all([
      scrapeRemoteOK(queryParams),
      scrapeWWRRSS(queryParams),
      scrapeRemotive(queryParams)
    ]);

    const allJobs: Job[] = [
      ...remoteOKJobs,
      ...wwrJobs,
      ...remotiveJobs
    ];

    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j =>
        j.title.toLowerCase() === job.title.toLowerCase() &&
        j.company.toLowerCase() === j.company.toLowerCase()
      )
    );

    console.log(`Total unique jobs found: ${uniqueJobs.length}`);
    
    if (uniqueJobs.length === 0) {
      console.log('Nenhuma vaga real encontrada para os parâmetros informados.');
      return [];
    }

    // Ordena por data e retorna até o limite máximo
    return uniqueJobs
      .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
      .slice(0, CONFIG.MAX_TOTAL_JOBS);
  } catch (error) {
    console.error('Error scraping jobs:', error);
    return [];
  }
} 