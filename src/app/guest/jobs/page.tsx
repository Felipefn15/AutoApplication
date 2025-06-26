'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { processFileUpload } from '@/lib/fileUtils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  createdAt: string;
}

export default function GuestJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setUploadProgress('Processing your resume...');

    try {
      // Process the file
      console.log('Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const { text, error: processError } = await processFileUpload(file);
      
      if (processError) {
        if (processError.includes('PDF parsing is not yet implemented')) {
          throw new Error('PDF file support is coming soon! For now, please upload a DOCX file.');
        }
        throw new Error(processError);
      }

      console.log('Text extracted successfully, length:', text?.length || 0);
      setUploadProgress('Analyzing resume content...');

      // Prepare the request body
      const requestBody = {
        resumeText: text,
        fileName: file.name,
        fileType: file.type,
      };

      console.log('Sending request to process-resume:', {
        fileName: file.name,
        fileType: file.type,
        textLength: text?.length || 0
      });

      // Send the extracted text to the server
      const response = await fetch('/api/guest/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. ${errorData.message || 'Please try again later.'}`);
        }
        throw new Error(errorData.message || 'Failed to process resume');
      }

      setUploadProgress('Finding matching jobs...');
      const data = await response.json();
      console.log('Received job matches:', data.matchedJobs?.length || 0);
      setJobs(data.matchedJobs);
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setError(error instanceof Error ? error.message : 'Failed to process resume');
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Find Jobs Matching Your Resume</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Your Resume</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <FileUpload onUpload={handleFileUpload} />
          {uploadProgress && (
            <p className="mt-4 text-sm text-gray-600">{uploadProgress}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Matching Jobs</h2>
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-2">{job.company} • {job.location}</p>
                <p className="text-gray-700 mb-4">{job.description}</p>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Job →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">Upload your resume to find matching jobs</p>
          <p className="text-sm text-gray-500 mt-2">Supported formats: DOCX (PDF support coming soon)</p>
        </div>
      )}
    </div>
  );
} 