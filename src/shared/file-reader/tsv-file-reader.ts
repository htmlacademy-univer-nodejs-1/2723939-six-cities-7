import {createReadStream} from 'node:fs';

export class TSVFileReader {
  constructor(private readonly filename: string) {}

  public async *read(): AsyncGenerator<string> {
    const stream = createReadStream(this.filename, {encoding: 'utf-8'});
    let pending = '';
    let firstChunk = true;
    try {
      for await (const chunk of stream) {
        pending += firstChunk ? String(chunk).replace(/^\uFEFF/, '') : chunk;
        firstChunk = false;
        let start = 0;
        let end = pending.indexOf('\n', start);
        while (end !== -1) {
          yield pending.slice(start, end).replace(/\r$/, '');
          start = end + 1;
          end = pending.indexOf('\n', start);
        }
        pending = pending.slice(start);
      }
      if (pending) {
        yield pending.replace(/\r$/, '');
      }
    } finally {
      stream.destroy();
    }
  }
}
