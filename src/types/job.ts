export interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  posted_at: string;
  skills: string[];
  salary?: string;
  employment_type?: string;
  experience_level?: string;
} 