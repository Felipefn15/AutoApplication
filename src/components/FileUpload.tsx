import { useState, useCallback } from 'react';

interface FileUploadProps {
  onUpload: (resumeData: { resumeText: string; fileName: string; fileType: string }) => Promise<void>;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({ onUpload, accept = '.docx,.doc,.pdf', maxSize = 5 * 1024 * 1024 }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      
      if (maxSize && file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      }

      // Create FormData
      const formData = new FormData();
      formData.append('resume', file);

      // Upload file and extract text
      const response = await fetch('/api/guest/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process resume');
      }

      // Pass the extracted text and metadata to the parent component
      await onUpload({
        resumeText: data.resumeText,
        fileName: data.fileName,
        fileType: data.fileType
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      throw error;
    }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      await handleFileUpload(file);
    } catch (error) {
      // Error is already handled in handleFileUpload
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) {
      setError('Please drop a valid file');
      return;
    }

    try {
      setIsUploading(true);
      await handleFileUpload(file);
    } catch (error) {
      // Error is already handled in handleFileUpload
    } finally {
      setIsUploading(false);
    }
  }, []);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-500'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept={accept}
          disabled={isUploading}
        />
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <span className="font-semibold text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">DOCX or DOC files up to 5MB</p>
          <p className="mt-1 text-xs text-gray-400">(PDF support coming soon)</p>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 