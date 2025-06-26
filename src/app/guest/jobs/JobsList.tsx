'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResumeData {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate: string;
    field: string;
  }>;
  jobPreferences: {
    desiredRole: string;
    desiredLocation: string;
    salaryRange: {
      min: number;
      max: number;
    };
    remotePreference: 'remote' | 'hybrid' | 'onsite';
  };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  applied?: boolean;
}

interface StoredData {
  resumeData: ResumeData;
  matchedJobs: Job[];
}

interface Props {
  userId: string;
}

export default function JobsList({ userId }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Load jobs from localStorage
    const storedDataStr = localStorage.getItem(`jobMatches_${userId}`);
    if (!storedDataStr) {
      router.replace('/guest');
      return;
    }

    try {
      const storedData = JSON.parse(storedDataStr) as StoredData;
      if (!storedData.matchedJobs || !Array.isArray(storedData.matchedJobs)) {
        throw new Error('Invalid job data format');
      }
      setJobs(storedData.matchedJobs);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing stored job data:', error);
      router.replace('/guest');
    }
  }, [userId, router]);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApplyToSelected = async () => {
    if (selectedJobs.size === 0) {
      setError('Please select at least one job to apply');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          jobIds: Array.from(selectedJobs),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply to jobs');
      }

      // Mark selected jobs as applied
      const updatedJobs = jobs.map(job => ({
        ...job,
        applied: selectedJobs.has(job.id) ? true : job.applied,
      }));
      setJobs(updatedJobs);

      // Update localStorage with the new job states
      const storedDataStr = localStorage.getItem(`jobMatches_${userId}`);
      if (storedDataStr) {
        const storedData = JSON.parse(storedDataStr) as StoredData;
        storedData.matchedJobs = updatedJobs;
        localStorage.setItem(`jobMatches_${userId}`, JSON.stringify(storedData));
      }

      // Clear selection
      setSelectedJobs(new Set());
    } catch (error) {
      console.error('Error applying to jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply to selected jobs');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">Loading matched jobs...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
            <div className="mt-4">
              <Link
                href="/guest"
                className="text-blue-600 hover:text-blue-500"
              >
                Return to Resume Upload
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Your Matched Jobs
          </h1>
          <p className="text-lg text-gray-600">
            Select the jobs you want to apply for and click "Apply to Selected"
          </p>
        </div>

        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm mb-6 py-4 px-6 rounded-lg shadow-sm flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            {selectedJobs.size} {selectedJobs.size === 1 ? 'job' : 'jobs'} selected
          </div>
          <button
            onClick={handleApplyToSelected}
            disabled={applying || selectedJobs.size === 0}
            className={`inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-full shadow-sm text-white transition-all duration-200 ${
              applying || selectedJobs.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
            }`}
          >
            {applying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Applying...
              </>
            ) : (
              'Apply to Selected'
            )}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
                job.applied ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {job.applied ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Applied
                          </span>
                        ) : (
                          <label className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedJobs.has(job.id)}
                              onChange={() => handleJobSelect(job.id)}
                              disabled={job.applied}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                      <span className="font-medium text-gray-700">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-600">
                      {job.description}
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="text-sm font-medium text-gray-700">Match Score:</div>
                      <div className="ml-2 flex items-center">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                            style={{ width: `${job.matchScore}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{job.matchScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Want to save your progress and access more features?{' '}
            <Link
              href={`/auth/register?userId=${userId}`}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 