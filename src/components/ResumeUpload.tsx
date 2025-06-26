import { useState } from 'react';
import { FileUpload } from './FileUpload';

interface ResumeUploadProps {
  onComplete: (resumeText: string) => void;
}

export function ResumeUpload({ onComplete }: ResumeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (resumeData: { resumeText: string; fileName: string; fileType: string }) => {
    try {
      setError(null);
      setIsProcessing(true);

      // Send the extracted text to the process-resume endpoint
      const response = await fetch('/api/guest/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: resumeData.resumeText,
          fileName: resumeData.fileName,
          fileType: resumeData.fileType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process resume');
      }

      // Call the onComplete callback with the processed resume text
      onComplete(data.resumeText);

    } catch (error) {
      console.error('Error processing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to process resume');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload onUpload={handleUpload} />
      {isProcessing && (
        <div className="text-center">
          <p className="text-sm text-gray-600">Processing your resume...</p>
        </div>
      )}
      {error && (
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
} 