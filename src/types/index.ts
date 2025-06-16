export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  source: string;
  source_url: string;
  apply_url?: string;
  posted_at: string;
  created_at: string;
  applied: boolean;
  applied_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  search_keywords: string[];
  job_types: string[];
  resume_url?: string;
  preferences: {
    remote_only: boolean;
    full_time_only: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ApplicationSettings {
  cover_letter_template: string;
  email_subject_template: string;
  email_signature: string;
} 