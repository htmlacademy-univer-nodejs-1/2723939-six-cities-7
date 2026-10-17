#!/usr/bin/env node
import {chalkStderr} from 'chalk';
import { CLIApplication, GenerateCommand, HelpCommand, ImportCommand, VersionCommand } from './cli/index.js';

async function bootstrap(): Promise<void> {
  const cliApplication = new CLIApplication();
  cliApplication.registerCommands([
    new HelpCommand(),
    new VersionCommand(),
    new ImportCommand(),
    new GenerateCommand()
  ]);

  await cliApplication.processCommand(process.argv.slice(2));
}

bootstrap().catch((error: unknown) => {
  console.error(chalkStderr.red.bold('Ошибка: '), chalkStderr.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
