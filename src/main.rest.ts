#!/usr/bin/env node
import {createRestContainer} from './rest/rest.container.js';
import {Application} from './rest/application.js';
import {Logger} from './shared/libs/logger/logger.interface.js';
import {Component} from './shared/types/component.enum.js';

function bootstrap(): void {
  const container = createRestContainer(process.argv.includes('--pretty'));
  const logger = container.get<Logger>(Component.Logger);
  try {
    const application = container.get<Application>(Component.Application);
    application.init();
  } catch (error: unknown) {
    logger.error('Application initialization failed.', error);
    process.exitCode = 1;
  }
}

bootstrap();
