import 'reflect-metadata';
import {Container} from 'inversify';
import {Config} from '../shared/libs/config/config.interface.js';
import {RestConfigService} from '../shared/libs/config/rest.config.js';
import {Component} from '../shared/types/component.enum.js';
import {Application} from './application.js';
import {createContainer} from '../shared/container.js';

export function createRestContainer(prettyLogs = false): Container {
  const container = createContainer(prettyLogs);
  container.bind<Config>(Component.Config).to(RestConfigService).inSingletonScope();
  container.bind<Application>(Component.Application).to(Application).inSingletonScope();
  return container;
}
