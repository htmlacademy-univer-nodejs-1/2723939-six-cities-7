import convict from 'convict';
import {config as loadEnv} from 'dotenv';
import {injectable} from 'inversify';
import {Config} from './config.interface.js';
import {RestConfig} from './rest-config.type.js';
import {restConfigSchema} from './rest-config.schema.js';

@injectable()
export class RestConfigService implements Config {
  private readonly config: RestConfig;

  constructor() {
    const {error} = loadEnv({quiet: true});
    if (error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error('Cannot read the .env configuration file.');
    }
    const config = convict<RestConfig>(restConfigSchema);
    config.validate({allowed: 'strict'});
    this.config = config.getProperties();
  }

  public get<T extends keyof RestConfig>(key: T): RestConfig[T] {
    return this.config[key];
  }
}
