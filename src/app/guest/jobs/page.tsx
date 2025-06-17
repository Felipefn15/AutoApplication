'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  graduationDate: string;
  field: string;
}

interface JobPreferences {
  desiredRole: string;
  desiredLocation: string;
  salaryRange: {
    min: number;
    max: number;
  };
  remotePreference: 'remote' | 'hybrid' | 'onsite';
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  match_score: number;
  applied?: boolean;
}

interface GuestSession {
  applications_remaining: number;
  resume_data: {
    skills: string[];
    experience: Experience[];
    education: Education[];
    job_preferences: JobPreferences;
  };
}

export default function GuestJobsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<GuestSession | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    async function fetchSessionAndJobs() {
      try {
        // Fetch guest session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('guest_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session not found');

        setSession(sessionData as GuestSession);

        // Fetch matching jobs
        const response = await fetch('/api/jobs/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            resumeData: sessionData.resume_data,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch matching jobs');
        }

        const { jobs: matchedJobs } = await response.json();
        setJobs(matchedJobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionAndJobs();
  }, [sessionId, supabase]);

  async function handleApply(jobId: string) {
    try {
      if (!session || session.applications_remaining <= 0) {
        setError('No applications remaining. Please create an account to continue.');
        return;
      }

      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          jobId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }

      // Update applications remaining
      setSession(prev => prev ? {
        ...prev,
        applications_remaining: prev.applications_remaining - 1
      } : null);

      // Update job status in the list
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, applied: true } : job
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for job');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">Loading matching jobs...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Your Matching Jobs
          </h1>
          <p className="text-lg text-gray-600">
            Applications remaining: {session?.applications_remaining || 0}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {job.title}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {job.match_score}% Match
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-sm text-gray-600">{job.location}</p>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                  {job.description}
                </p>
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={job.applied || (session?.applications_remaining || 0) <= 0}
                  className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${
                      job.applied
                        ? 'bg-gray-400 cursor-not-allowed'
                        : session?.applications_remaining && session.applications_remaining > 0
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                  {job.applied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center text-gray-600 mt-8">
            No matching jobs found. Try uploading a different resume or check back later.
          </div>
        )}
      </div>
    </div>
  );
} 