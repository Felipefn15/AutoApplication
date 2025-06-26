declare module 'pizzip' {
  class PizZip {
    constructor(data: ArrayBuffer);
  }
  export default PizZip;
}

declare module 'docxtemplater' {
  class Docxtemplater {
    constructor();
    loadZip(zip: any): void;
    getFullText(): string;
  }
  export default Docxtemplater;
} 