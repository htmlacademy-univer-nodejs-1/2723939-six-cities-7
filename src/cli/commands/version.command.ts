import chalk from 'chalk';
import {Command} from '../command.interface.js';
import {readFile} from 'node:fs/promises';

export class VersionCommand implements Command{
  public getName(): string {
    return '--version';
  }

  public async execute(...parameters: string[]): Promise<void> {
    if (parameters.length) {
      throw new Error('Usage: --version');
    }
    const version = await this.getVersion();
    console.info(chalk.cyan.bold(version));
  }

  private async getVersion(packageJsonPath = new URL('../../../package.json', import.meta.url)): Promise<string>{
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson: {version?: unknown} = JSON.parse(content);
    if (typeof packageJson.version !== 'string' || !packageJson.version) {
      throw new Error('package.json must contain a version string.');
    }
    return packageJson.version;
  }
}
