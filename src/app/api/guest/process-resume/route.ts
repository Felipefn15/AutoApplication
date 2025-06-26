import { NextResponse } from 'next/server';

interface ProcessResumeRequest {
  resumeText: string;
  fileName: string;
  fileType: string;
}

export async function POST(request: Request) {
  console.log('Processing resume text...');

  try {
    // Parse JSON request
    const body = await request.json() as ProcessResumeRequest;
    const { resumeText, fileName, fileType } = body;

    // Validate required fields
    if (!resumeText || !fileName || !fileType) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Missing required fields',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate text content
    if (resumeText.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid content',
          message: 'Resume text cannot be empty',
          code: 'EMPTY_CONTENT'
        },
        { status: 400 }
      );
    }

    // Here you can add additional processing like:
    // - Cleaning and formatting the text
    // - Extracting specific sections (education, experience, etc.)
    // - Running it through an LLM for analysis
    // - Storing in database
    // For now, we'll just return the cleaned text

    const processedText = resumeText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ')                   // Normalize whitespace
      .trim();

    return NextResponse.json({
      resumeText: processedText,
      fileName,
      fileType,
      message: 'Resume processed successfully'
    });

  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Failed to process resume',
        code: 'PROCESSING_ERROR'
      },
      { status: 500 }
    );
  }
} 