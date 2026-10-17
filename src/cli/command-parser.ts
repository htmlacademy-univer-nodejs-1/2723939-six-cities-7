type ParsedCommand = Record<string, string[]>;

export class CommandParser {
  static parse(cliArguments: string[]): ParsedCommand {
    const parsedCommand: ParsedCommand = Object.create(null);
    let currentCommand = '';

    for (const argument of cliArguments) {
      if (argument.startsWith('--')) {
        if (currentCommand) {
          throw new Error('Specify only one command per invocation. Use --help for usage.');
        }
        parsedCommand[argument] = [];
        currentCommand = argument;
      } else if (currentCommand && argument) {
        parsedCommand[currentCommand].push(argument);
      } else {
        throw new Error(`Unexpected argument: ${argument}. Use --help for usage.`);
      }
    }

    return parsedCommand;
  }
}
