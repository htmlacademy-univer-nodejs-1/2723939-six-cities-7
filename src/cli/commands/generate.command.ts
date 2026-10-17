import axios from 'axios';
import chalk from 'chalk';
import {extname} from 'node:path';
import {Command} from '../command.interface.js';
import {TSVFileWriter} from '../../shared/file-writer/tsv-file-writer.js';
import {OfferGenerator, validateMockData} from '../../shared/offer-generator.js';
import {TSV_HEADER} from '../../shared/offer-parser.js';
import {serializeOffer} from '../../shared/offer-serializer.js';
import {MockServerData} from '../../types/mock-server-data.type.js';

type GenerateOptions = {
  count: number;
  filename: string;
  url: URL;
};

export class GenerateCommand implements Command {
  public getName(): string {
    return '--generate';
  }

  public async execute(...parameters: string[]): Promise<void> {
    const {count, filename, url} = this.parseParameters(parameters);
    const data = await this.loadMockData(url);
    const generator = new OfferGenerator(data);
    await new TSVFileWriter(filename).write(this.generateLines(generator, count));
    console.info(chalk.green.bold(`Создано предложений: ${count}. Файл: ${filename}`));
  }

  private parseParameters(parameters: string[]): GenerateOptions {
    const [amount, filename, address] = parameters;
    if (parameters.length !== 3 || !/^\d+$/.test(amount)
      || !Number.isSafeInteger(Number(amount)) || Number(amount) < 1
      || extname(filename).toLowerCase() !== '.tsv') {
      throw new Error('Usage: --generate <positive integer> <filepath.tsv> <http(s) url>');
    }
    const url = new URL(address);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Mock server URL must use HTTP or HTTPS.');
    }
    return {count: Number(amount), filename, url};
  }

  private async loadMockData(url: URL): Promise<MockServerData> {
    const {data} = await axios.get<unknown>(url.href, {timeout: 10000});
    validateMockData(data);
    return data;
  }

  private *generateLines(generator: OfferGenerator, count: number): Generator<string> {
    yield `${TSV_HEADER}\n`;
    for (let index = 0; index < count; index++) {
      yield `${serializeOffer(generator.generate())}\n`;
    }
  }
}
