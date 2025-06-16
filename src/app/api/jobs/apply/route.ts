import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

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

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .single();

    if (jobError) {
      throw jobError;
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.applied) {
      return NextResponse.json(
        { error: 'Already applied to this job' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.resume_url) {
      return NextResponse.json(
        { error: 'Please upload your resume before applying' },
        { status: 400 }
      );
    }

    // Mark job as applied
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        applied: true,
        applied_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('user_id', session.user.id);

    if (updateError) {
      throw updateError;
    }

    // TODO: Implement actual job application logic here
    // This could involve:
    // 1. Sending an email with the resume
    // 2. Making an API call to the job board
    // 3. Filling out a form on the company's website
    // For now, we'll just return the apply URL if available

    return NextResponse.json({
      message: 'Application marked as sent',
      apply_url: job.apply_url
    });

  } catch (error) {
    console.error('Error applying to job:', error);
    return NextResponse.json(
      { error: 'Failed to apply to job' },
      { status: 500 }
    );
  }
} 