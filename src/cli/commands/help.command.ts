import chalk from 'chalk';
import {Command} from '../command.interface.js';

export class HelpCommand implements Command{
  public getName(): string {
    return '--help';
  }

  public execute(...parameters: string[]): void {
    if (parameters.length) {
      throw new Error('Usage: --help');
    }
    console.info([
      chalk.bgMagenta.white.bold(' Шесть городов — CLI '),
      chalk.cyan('Программа для подготовки данных для REST API сервера.'),
      '',
      `${chalk.yellow.bold('Пример:')} ${chalk.white('npm run cli -- --<command> [arguments]')}`,
      '',
      chalk.blueBright.bold('Команды:'),
      chalk.green('  --help                       Выводит справку (команда по умолчанию).'),
      chalk.cyan('  --version                    Выводит версию из package.json.'),
      chalk.magenta('  --import <filepath>          Читает TSV и выводит предложения в консоль.'),
      chalk.yellow('  --generate <n> <path> <url>   Генерация тестовых данных (следующий этап, пока недоступна).')
    ].join('\n'));
  }
}
