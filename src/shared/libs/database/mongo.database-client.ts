import {inject, injectable} from 'inversify';
import type {Connection} from 'mongoose';
import {Component} from '../../types/component.enum.js';
import {Logger} from '../logger/logger.interface.js';
import {DatabaseClient} from './database-client.interface.js';

@injectable()
export class MongoDatabaseClient implements DatabaseClient {
  constructor(
    @inject(Component.Connection) private readonly connection: Connection,
    @inject(Component.Logger) private readonly logger: Logger
  ) {}

  public async connect(uri: string): Promise<void> {
    this.logger.info('Connecting to MongoDB...');
    try {
      await this.connection.openUri(uri, {serverSelectionTimeoutMS: 5000});
      this.logger.info('MongoDB connection established.');
    } catch {
      this.logger.error('MongoDB connection failed.');
      throw new Error('Cannot connect to MongoDB. Check the connection settings and server availability.');
    }
  }

  public async disconnect(): Promise<void> {
    await this.connection.close();
    this.logger.info('MongoDB connection closed.');
  }
}
