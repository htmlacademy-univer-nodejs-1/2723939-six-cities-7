import {randomBytes} from 'node:crypto';
import {access} from 'node:fs/promises';
import {extname} from 'node:path';
import {inject, injectable} from 'inversify';
import {Command} from '../command.interface.js';
import {TSVFileReader} from '../../shared/file-reader/tsv-file-reader.js';
import {ImportedOffer, parseOffer, TSV_HEADER} from '../../shared/offer-parser.js';
import {DatabaseClient} from '../../shared/libs/database/database-client.interface.js';
import {Logger} from '../../shared/libs/logger/logger.interface.js';
import {UserService} from '../../shared/modules/user/user-service.interface.js';
import {OfferService} from '../../shared/modules/offer/offer-service.interface.js';
import {Component} from '../../shared/types/component.enum.js';

@injectable()
export class ImportCommand implements Command {
  constructor(
    @inject(Component.DatabaseClient) private readonly database: DatabaseClient,
    @inject(Component.UserService) private readonly users: UserService,
    @inject(Component.OfferService) private readonly offers: OfferService,
    @inject(Component.Logger) private readonly logger: Logger
  ) {}

  public getName(): string {
    return '--import';
  }

  public async execute(...parameters: string[]): Promise<void> {
    const [filename, uri] = this.parseParameters(parameters);
    await access(filename);
    try {
      await this.database.connect(uri);
      const count = await this.importFile(filename);
      this.logger.info(`Сохранено предложений: ${count}.`);
    } finally {
      await this.database.disconnect();
    }
  }

  private parseParameters(parameters: string[]): [string, string] {
    const [filename, uri] = parameters;
    if (parameters.length !== 2 || extname(filename).toLowerCase() !== '.tsv'
      || !/^mongodb(?:\+srv)?:\/\/\S+$/.test(uri)) {
      throw new Error('Usage: --import <filepath.tsv> <mongodb-uri>');
    }
    return [filename, uri];
  }

  private async importFile(filename: string): Promise<number> {
    let count = 0;
    let lineNumber = 0;
    for await (const line of new TSVFileReader(filename).read()) {
      lineNumber++;
      if (!line.trim() || (lineNumber === 1 && line === TSV_HEADER)) {
        continue;
      }
      try {
        await this.saveOffer(parseOffer(line));
        count++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${filename}:${lineNumber}: ${message}. Successfully saved: ${count}.`);
      }
    }
    return count;
  }

  private async saveOffer(data: ImportedOffer): Promise<void> {
    const {author, ...offer} = data;
    const user = await this.users.findByEmail(author.email)
      ?? await this.users.create({...author, password: randomBytes(9).toString('base64url')});
    await this.offers.create({...offer, authorId: user.id, commentsCount: 0});
  }
}
