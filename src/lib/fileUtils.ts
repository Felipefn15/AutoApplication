import docx4js from 'docx4js';

/**
 * Converts a File object to text content.
 * For DOCX files, it uses docx4js to extract text content.
 * For other files, it uses the standard text decoder.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log('Starting text extraction for file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // For DOCX files, use docx4js
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing DOCX file...');
      const arrayBuffer = await file.arrayBuffer();
      const doc = await docx4js.load(arrayBuffer);
      const content = await doc.getText();
      console.log('DOCX text extracted, length:', content?.length || 0);
      const cleanedText = cleanText(content);
      console.log('DOCX text cleaned, length:', cleanedText.length);
      return cleanedText;
    }
    
    // For PDF files, we'll need to implement PDF parsing later
    if (file.type === 'application/pdf') {
      throw new Error('PDF parsing is not yet implemented');
    }
    
    // For other file types, use standard text extraction
    console.log('Using standard text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    const cleanedText = cleanText(text);
    console.log('Standard text extracted and cleaned, length:', cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    if (error instanceof Error) {
      if (error.message.includes('docx4js')) {
        throw new Error('Failed to parse DOCX file. Please ensure the file is not corrupted.');
      }
      throw error;
    }
    throw new Error('Failed to extract text from file');
  }
}

/**
 * Cleans up raw text by removing non-printable characters and normalizing whitespace
 */
function cleanText(text: string): string {
  if (!text) {
    console.warn('Received empty text for cleaning');
    return '';
  }

  const cleaned = text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove non-printable characters
    .replace(/\s+/g, ' ')                   // Normalize whitespace
    .trim();

  if (cleaned.length === 0) {
    console.warn('Text cleaning resulted in empty string');
  }

  return cleaned;
}

/**
 * Processes a file upload and returns the extracted text content.
 * This function handles validation and text extraction.
 */
export async function processFileUpload(file: File, maxSize = 5 * 1024 * 1024): Promise<{ text: string; error?: string }> {
  try {
    console.log('Starting file upload processing:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file size
    if (maxSize && file.size > maxSize) {
      return { text: '', error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return { text: '', error: 'Please upload a valid resume file (PDF, DOC, or DOCX).' };
    }

    // Extract text from file
    const text = await extractTextFromFile(file);
    
    if (!text || text.trim().length === 0) {
      return { text: '', error: 'No text content found in file' };
    }

    console.log('File processing completed successfully, text length:', text.length);
    return { text };
  } catch (error) {
    console.error('Error in processFileUpload:', error);
    return { text: '', error: error instanceof Error ? error.message : 'Failed to process file' };
  }
}

/**
 * Validates a file type against a list of allowed types.
 */
export function isValidFileType(fileType: string): boolean {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  return allowedTypes.includes(fileType);
} 