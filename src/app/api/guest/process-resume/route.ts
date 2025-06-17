import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
// @ts-expect-error - No type definitions available for pdf2json
import { PDFParser } from 'pdf2json';
// @ts-expect-error - No type definitions available for mammoth
import mammoth from 'mammoth';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    console.log('Starting resume processing...');
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Generate a unique session ID for the guest user
    const sessionId = uuidv4();

    // Read the file content
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      console.log('Processing PDF file...');
      const pdfParser = new PDFParser();
      
      extractedText = await new Promise<string>((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', () => {
          console.log('PDF parsing completed');
          resolve(pdfParser.getRawTextContent());
        });
        
        pdfParser.on('pdfParser_dataError', (errMsg: { parserError: Error }) => {
          console.error('PDF parsing error:', errMsg.parserError);
          reject(errMsg.parserError);
        });

        try {
          pdfParser.parseBuffer(buffer);
        } catch (error) {
          console.error('Error during PDF parsing:', error);
          reject(error);
        }
      });
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      console.log('Processing Word document...');
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        console.log('Word document processing completed');
      } catch (error) {
        console.error('Error processing Word document:', error);
        throw error;
      }
    } else {
      console.error('Unsupported file type:', file.type);
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or Word document.' },
        { status: 400 }
      );
    }

    if (!extractedText) {
      console.error('No text extracted from the document');
      return NextResponse.json(
        { error: 'Could not extract text from the document' },
        { status: 400 }
      );
    }

    console.log('Text extracted successfully, length:', extractedText.length);

    // Use OpenAI to extract structured information from the resume
    console.log('Starting OpenAI processing...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts key information from resumes. Please extract and structure the following information: skills, experience, education, and job preferences. Format the response as JSON."
        },
        {
          role: "user",
          content: extractedText
        }
      ]
    });

    if (!completion.choices[0].message.content) {
      console.error('No content received from OpenAI');
      return NextResponse.json(
        { error: 'Failed to process resume content' },
        { status: 500 }
      );
    }

    console.log('OpenAI processing completed');
    const resumeData = JSON.parse(completion.choices[0].message.content);

    // Store the resume data and session ID in Supabase
    console.log('Storing data in Supabase...');
    const { error: dbError } = await supabase
      .from('guest_sessions')
      .insert({
        session_id: sessionId,
        resume_data: resumeData,
        created_at: new Date().toISOString(),
        applications_remaining: 20
      });

    if (dbError) {
      console.error('Error storing resume data:', dbError);
      return NextResponse.json(
        { error: 'Failed to process resume' },
        { status: 500 }
      );
    }

    console.log('Resume processing completed successfully');
    return NextResponse.json({
      sessionId,
      message: 'Resume processed successfully',
      data: resumeData
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process resume' },
      { status: 500 }
    );
  }
} 