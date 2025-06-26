declare global {
  interface FormDataFile extends File {
    text(): Promise<string>;
  }

  interface Blob {
    text(): Promise<string>;
  }
} 