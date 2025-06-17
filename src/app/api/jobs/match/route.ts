import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchScore {
  jobId: string;
  score: number;
}

export async function POST(request: Request) {
  try {
    const { sessionId, resumeData } = await request.json();

    if (!sessionId || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Verify guest session exists and has applications remaining
    const { data: sessionData, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('applications_remaining')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    if (sessionData.applications_remaining <= 0) {
      return NextResponse.json(
        { error: 'No applications remaining' },
        { status: 400 }
      );
    }

    // Fetch available jobs from the database
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .limit(50);

    if (jobsError) {
      throw jobsError;
    }

    // Use OpenAI to calculate match scores
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a job matching expert. Analyze the candidate's resume data and the job listings to calculate match scores.
            For each job, provide a score from 0-100 based on:
            - Skills match (40%)
            - Experience relevance (30%)
            - Education fit (20%)
            - Location and preferences match (10%)
            Return the results as a JSON array of objects with job IDs and match scores.`
        },
        {
          role: "user",
          content: JSON.stringify({
            resume: resumeData,
            jobs: jobs
          })
        }
      ]
    });

    const matchScores = JSON.parse(completion.choices[0].message.content || '[]') as MatchScore[];

    // Combine job data with match scores and sort by score
    const matchedJobs = jobs
      .map(job => ({
        ...job,
        match_score: matchScores.find((score: MatchScore) => score.jobId === job.id)?.score || 0
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20); // Return top 20 matches

    return NextResponse.json({ jobs: matchedJobs });
  } catch (error) {
    console.error('Error matching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to match jobs' },
      { status: 500 }
    );
  }
} 