import { NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/fileUtils';

export async function POST(request: Request) {
  console.log('Starting resume upload...');
  
  try {
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          error: 'Invalid content type',
          message: 'Request must be multipart/form-data',
          code: 'INVALID_CONTENT_TYPE'
        },
        { status: 400 }
      );
    }

    // Get the file from FormData
    const formData = await request.formData();
    const fileData = formData.get('resume');
    
    if (!fileData || !(fileData instanceof Blob)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'No file provided or invalid file format',
          code: 'MISSING_FILE'
        },
        { status: 400 }
      );
    }

    // Get file metadata
    const fileType = fileData.type;
    const fileName = (fileData as any).name || 'resume';

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (fileData.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `File size must be less than ${maxSize / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Please upload a valid resume file (PDF, DOC, or DOCX).',
          code: 'INVALID_FILE_TYPE'
        },
        { status: 400 }
      );
    }

    try {
      // Extract text from file
      const text = await fileData.text();
      const resumeText = text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove non-printable characters
        .replace(/\s+/g, ' ')                   // Normalize whitespace
        .trim();

      if (!resumeText || resumeText.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Empty file',
            message: 'No text content found in file',
            code: 'EMPTY_FILE'
          },
          { status: 400 }
        );
      }

      // Return the extracted text and file metadata
      return NextResponse.json({
        resumeText,
        fileName,
        fileType
      });

    } catch (error) {
      console.error('Error extracting text:', error);
      return NextResponse.json(
        {
          error: 'File processing failed',
          message: error instanceof Error ? error.message : 'Failed to process file',
          code: 'PROCESSING_ERROR'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
} 