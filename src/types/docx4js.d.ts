declare module 'docx4js' {
  interface Document {
    getText(): Promise<string>;
  }

  interface Docx4js {
    load(buffer: ArrayBuffer): Promise<Document>;
  }

  const docx4js: Docx4js;
  export default docx4js;
} 