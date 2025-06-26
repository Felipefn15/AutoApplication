import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Job } from '@/types/job';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Job;
        Update: Partial<Job>;
      };
    };
  };
}

// Export the createClient function
export const createClient = () => createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export the default client instance
export const supabase = createClient();
