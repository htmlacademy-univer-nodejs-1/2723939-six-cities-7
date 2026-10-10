import {readFile} from 'node:fs/promises';

export class TSVFileReader {
  constructor(private readonly filename: string) {}

  public async read(): Promise<string[]> {
    const content = await readFile(this.filename, 'utf-8');
    return content.replace(/^\uFEFF/, '').split(/\r?\n/);
  }
}
