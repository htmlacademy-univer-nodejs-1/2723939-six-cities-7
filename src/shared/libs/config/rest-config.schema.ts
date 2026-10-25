import convict from 'convict';
import validatorFormats from 'convict-format-with-validator';
import {RestConfig} from './rest-config.type.js';

convict.addFormats(validatorFormats);
convict.addFormat({
  name: 'required-port',
  coerce: (value: unknown) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  validate: (value: unknown) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error('must be an integer between 1 and 65535');
    }
  }
});

export const restConfigSchema: convict.Schema<RestConfig> = {
  PORT: {
    doc: 'Port for the REST API service.',
    format: 'required-port',
    default: null,
    env: 'PORT'
  },
  DB_HOST: {
    doc: 'Database server IPv4 or IPv6 address.',
    format: 'ipaddress',
    default: null,
    env: 'DB_HOST',
    sensitive: true
  },
  SALT: {
    doc: 'Secret salt for hashing passwords.',
    format: (value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('must be a non-empty string');
      }
    },
    default: null,
    env: 'SALT',
    sensitive: true
  }
};
