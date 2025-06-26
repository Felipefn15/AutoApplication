'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Job } from '@/types/job';

interface JobsResponse {
  jobs: Job[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    experienceLevel: '',
    employmentType: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [currentPage, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (filters.skills.length > 0) {
        queryParams.set('skills', filters.skills.join(','));
      }
      if (filters.experienceLevel) {
        queryParams.set('experienceLevel', filters.experienceLevel);
      }
      if (filters.employmentType) {
        queryParams.set('employmentType', filters.employmentType);
      }

      const response = await fetch(`/api/jobs?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data: JobsResponse = await response.json();
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobSelection = (jobUrl: string) => {
    setSelectedJobs(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(jobUrl)) {
        newSelection.delete(jobUrl);
      } else {
        newSelection.add(jobUrl);
      }
      return newSelection;
    });
  };

  const handleAutoApply = async () => {
    if (selectedJobs.size === 0) {
      setError('Please select at least one job to apply');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedJobsData = jobs.filter(job => selectedJobs.has(job.url));
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobs: selectedJobsData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply to jobs');
      }

      await response.json();
      router.push('/applications');
    } catch (error) {
      console.error('Error applying to jobs:', error);
      setError('Failed to apply to selected jobs');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Available Jobs
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Select the jobs you want to apply for and we'll handle the application process.
            </p>
          </div>

          <div className="mt-12">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div
                    key={job.url}
                    className={`bg-white shadow rounded-lg p-6 transition-all ${
                      selectedJobs.has(job.url) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {job.title}
                          </h2>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {job.source}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-600">{job.company}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            {job.location} • {job.employment_type || 'Not specified'} • Posted {new Date(job.posted_at).toLocaleDateString()}
                          </p>
                          {job.salary && (
                            <p className="text-gray-500 text-sm mt-1">
                              Salary: {job.salary}
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          <p className="text-gray-700 line-clamp-3">
                            {job.description}
                          </p>
                        </div>
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center space-x-4">
                          <button
                            onClick={() => toggleJobSelection(job.url)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              selectedJobs.has(job.url)
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {selectedJobs.has(job.url) ? 'Selected' : 'Select for Apply'}
                          </button>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Original Posting →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {jobs.length > 0 && (
                  <div className="mt-8 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}

                {jobs.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleAutoApply}
                      disabled={selectedJobs.size === 0 || loading}
                      className={`px-6 py-3 rounded-md text-white font-medium ${
                        selectedJobs.size === 0 || loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {loading
                        ? 'Applying...'
                        : `Apply to ${selectedJobs.size} Selected Job${selectedJobs.size === 1 ? '' : 's'}`}
                    </button>
                  </div>
                )}

                {jobs.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      No jobs found. Try adjusting your filters or check back later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 