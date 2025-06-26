declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: any[];
  }

  interface BrowserOptions {
    arrayBuffer: ArrayBuffer;
  }

  export function convertToHtml(input: BrowserOptions): Promise<ExtractResult>;
  export function extractRawText(input: BrowserOptions): Promise<ExtractResult>;
} 