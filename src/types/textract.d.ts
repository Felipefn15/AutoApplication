declare module 'textract' {
  type TextractCallback = (error: Error | null, text: string) => void;

  export function fromBufferWithMime(
    mimeType: string,
    buffer: Buffer,
    callback: TextractCallback
  ): void;
} 