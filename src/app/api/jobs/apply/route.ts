import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, jobId } = await request.json();

    if (!sessionId || !jobId) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Start a transaction
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('applications_remaining, resume_data')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    if (session.applications_remaining <= 0) {
      return NextResponse.json(
        { error: 'No applications remaining' },
        { status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Record the application
    const { error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        session_id: sessionId,
        resume_data: session.resume_data,
        status: 'submitted',
        applied_at: new Date().toISOString()
      });

    if (applicationError) {
      throw applicationError;
    }

    // Decrement applications remaining
    const { error: updateError } = await supabase
      .from('guest_sessions')
      .update({ 
        applications_remaining: session.applications_remaining - 1 
      })
      .eq('session_id', sessionId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      applications_remaining: session.applications_remaining - 1
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
} 