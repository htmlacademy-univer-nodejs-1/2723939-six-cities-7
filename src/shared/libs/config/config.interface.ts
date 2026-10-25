import {RestConfig} from './rest-config.type.js';

export interface Config {
  get<T extends keyof RestConfig>(key: T): RestConfig[T];
}
