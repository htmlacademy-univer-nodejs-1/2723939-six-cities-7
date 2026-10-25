#!/usr/bin/env node
import 'reflect-metadata';
import {chalkStderr} from 'chalk';
import { CLIApplication, GenerateCommand, HelpCommand, ImportCommand, VersionCommand } from './cli/index.js';
import {createCliContainer} from './cli/cli.container.js';
import {Component} from './shared/types/component.enum.js';

async function bootstrap(): Promise<void> {
  const cliApplication = new CLIApplication();
  cliApplication.registerCommands([
    new HelpCommand(),
    new VersionCommand(),
    new GenerateCommand()
  ]);

  if (process.argv[2] === '--import') {
    cliApplication.registerCommands([
      createCliContainer().get<ImportCommand>(Component.ImportCommand)
    ]);
  }

  await cliApplication.processCommand(process.argv.slice(2));
}

bootstrap().catch((error: unknown) => {
  console.error(chalkStderr.red.bold('Ошибка: '), chalkStderr.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
