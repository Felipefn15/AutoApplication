import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { extract } from 'office-text-extractor';

export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided',
          message: 'Please select a file to process.',
          code: 'NO_FILE'
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from the document
    const text = await extract(buffer);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Text extraction failed',
        message: error instanceof Error ? error.message : 'Failed to extract text from file',
        code: 'EXTRACTION_ERROR'
      },
      { status: 500 }
    );
  }
} 