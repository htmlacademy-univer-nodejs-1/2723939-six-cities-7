import {inject, injectable} from 'inversify';
import {Config} from '../shared/libs/config/config.interface.js';
import {Logger} from '../shared/libs/logger/logger.interface.js';
import {Component} from '../shared/types/component.enum.js';

@injectable()
export class Application {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config
  ) {}

  public init(): void {
    this.logger.info(`Application initialized. Port: ${this.config.get('PORT')}.`);
  }
}
