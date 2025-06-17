import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
    );
  }

  return createClientComponentClient();
};

// Admin client for server-side operations
export const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable'
    );
  }

  return createSupabaseClient(url, serviceRole);
};
