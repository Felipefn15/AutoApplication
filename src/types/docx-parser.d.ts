declare module 'docx-parser' {
  export class DocxParser {
    parseBuffer(buffer: Uint8Array): Promise<string>;
  }
} 