declare module 'docx2txt' {
  interface Docx2txt {
    fromBuffer(buffer: Buffer): Promise<string>;
  }

  const docx2txt: Docx2txt;
  export default docx2txt;
} 