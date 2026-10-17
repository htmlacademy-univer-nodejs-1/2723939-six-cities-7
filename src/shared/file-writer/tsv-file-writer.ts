import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export class TSVFileWriter {
  constructor(private readonly filename: string) {}

  public async write(lines: Iterable<string>): Promise<void> {
    await pipeline(Readable.from(lines), createWriteStream(this.filename, {encoding: 'utf-8'}));
  }
}
