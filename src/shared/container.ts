import 'reflect-metadata';
import {Container} from 'inversify';
import {LoggerOptions} from 'pino';
import {Logger} from './libs/logger/logger.interface.js';
import {PinoLogger} from './libs/logger/pino.logger.js';
import {registerDatabase} from './libs/database/database.container.js';
import {Component} from './types/component.enum.js';

export function createContainer(prettyLogs = false): Container {
  const container = new Container();
  container.bind<LoggerOptions>(Component.LoggerOptions).toConstantValue({
    ...(prettyLogs ? {transport: {target: 'pino-pretty', options: {colorize: true}}} : {})
  });
  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  registerDatabase(container);
  return container;
}
