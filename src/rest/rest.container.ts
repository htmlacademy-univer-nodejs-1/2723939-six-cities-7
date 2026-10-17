import 'reflect-metadata';
import {Container} from 'inversify';
import {LoggerOptions} from 'pino';
import {Config} from '../shared/libs/config/config.interface.js';
import {RestConfigService} from '../shared/libs/config/rest.config.js';
import {Logger} from '../shared/libs/logger/logger.interface.js';
import {PinoLogger} from '../shared/libs/logger/pino.logger.js';
import {Component} from '../shared/types/component.enum.js';
import {Application} from './application.js';

export function createRestContainer(prettyLogs = false): Container {
  const container = new Container();
  container.bind<LoggerOptions>(Component.LoggerOptions).toConstantValue({
    ...(prettyLogs ? {transport: {target: 'pino-pretty', options: {colorize: true}}} : {})
  });
  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  container.bind<Config>(Component.Config).to(RestConfigService).inSingletonScope();
  container.bind<Application>(Component.Application).to(Application).inSingletonScope();
  return container;
}
