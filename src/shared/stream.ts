import {Writable} from 'node:stream';
import {once} from 'node:events';

export async function writeToStream(stream: Writable, data: string): Promise<void> {
  if (!stream.write(data)) {
    await once(stream, 'drain');
  }
}
