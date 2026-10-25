import {Container} from 'inversify';
import {createContainer} from '../shared/container.js';
import {Component} from '../shared/types/component.enum.js';
import {ImportCommand} from './commands/import.command.js';

export function createCliContainer(): Container {
  const container = createContainer();
  container.bind<ImportCommand>(Component.ImportCommand).to(ImportCommand);
  return container;
}
