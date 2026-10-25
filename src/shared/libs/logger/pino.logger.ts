import {inject, injectable} from 'inversify';
import pino, {Logger as PinoInstance, LoggerOptions} from 'pino';
import {Component} from '../../types/component.enum.js';
import {Logger} from './logger.interface.js';

@injectable()
export class PinoLogger implements Logger {
  private readonly logger: PinoInstance;

  constructor(@inject(Component.LoggerOptions) options: LoggerOptions) {
    this.logger = pino(options);
  }

  public debug(message: string): void {
    this.logger.debug(message);
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

  public error(message: string, error?: unknown): void {
    this.logger.error({err: error}, message);
  }
}
