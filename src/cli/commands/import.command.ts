import chalk from 'chalk';
import {extname} from 'node:path';
import {Command} from '../command.interface.js';
import {TSVFileReader} from '../../shared/file-reader/tsv-file-reader.js';
import {parseOffer, TSV_HEADER} from '../../shared/offer-parser.js';
import {writeToStream} from '../../shared/stream.js';

export class ImportCommand implements Command {
  public getName(): string {
    return '--import';
  }

  public async execute(...parameters: string[]): Promise<void> {
    if (parameters.length !== 1 || extname(parameters[0]).toLowerCase() !== '.tsv') {
      throw new Error('Usage: --import <filepath.tsv>');
    }
    const [filename] = parameters;
    const lines = new TSVFileReader(filename).read();
    console.info(chalk.bgBlue.white.bold(' Импорт TSV '));
    console.info(chalk.blueBright(`Файл: ${filename}\n`));
    const colors = [chalk.cyan, chalk.magenta, chalk.yellow, chalk.green, chalk.blueBright];
    let count = 0;
    let lineNumber = 0;
    for await (const line of lines) {
      lineNumber++;
      if (!line.trim() || (lineNumber === 1 && line === TSV_HEADER)) {
        continue;
      }
      try {
        const offer = parseOffer(line);
        const color = colors[count % colors.length];
        await writeToStream(process.stdout, [
          color.bold(`━━━ Предложение ${count + 1}: ${offer.title} ━━━`),
          color(JSON.stringify(offer, null, 2)),
          color('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        ].join('\n'));
        count++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${filename}:${lineNumber}: ${message}. Successfully read: ${count}.`);
      }
    }
    console.info(chalk.green.bold(`Прочитано предложений: ${count}.`));
  }
}
