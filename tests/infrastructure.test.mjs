import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {test} from 'node:test';
import {createRestContainer} from '../dist/rest/rest.container.js';
import {Component} from '../dist/shared/types/component.enum.js';

const exec = promisify(execFile);
const entrypoint = fileURLToPath(new URL('../dist/main.rest.js', import.meta.url));
const validEnv = {PORT: '4310', DB_HOST: '127.0.0.1', SALT: 'test-secret-do-not-log'};

async function createFixture(t, content) {
  const directory = await mkdtemp(join(tmpdir(), 'six-cities-infrastructure-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  if (content !== undefined) {
    await writeFile(join(directory, '.env'), content);
  }
  return directory;
}

function run(directory, variables = {}, args = []) {
  const env = {...process.env};
  for (const key of Object.keys(validEnv)) {
    delete env[key];
  }
  return exec(process.execPath, [entrypoint, ...args], {cwd: directory, env: {...env, ...variables}});
}

test('application loads .env, logs its port as JSON and keeps secrets out of logs', async (t) => {
  const directory = await createFixture(t, Object.entries(validEnv).map(([key, value]) => `${key}=${value}`).join('\n'));
  const {stdout, stderr} = await run(directory);
  const log = JSON.parse(stdout.trim());
  assert.equal(log.level, 30);
  assert.match(log.msg, /Application initialized\. Port: 4310\./);
  assert.equal(stderr, '');
  assert.ok(!stdout.includes(validEnv.SALT));
  assert.ok(!stdout.includes(validEnv.DB_HOST));
  const overridden = await run(directory, {PORT: '4311'});
  assert.match(JSON.parse(overridden.stdout).msg, /Port: 4311/);
});

test('environment variables work without .env and accept IPv4 and IPv6', async (t) => {
  const directory = await createFixture(t);
  for (const DB_HOST of ['127.0.0.1', '::1']) {
    const {stdout} = await run(directory, {...validEnv, DB_HOST});
    assert.equal(JSON.parse(stdout).level, 30);
  }
});

test('each required variable must be present; failures use the logger and exit 1', async (t) => {
  const directory = await createFixture(t);
  for (const key of Object.keys(validEnv)) {
    const variables = {...validEnv};
    delete variables[key];
    await assert.rejects(run(directory, variables), (error) => {
      assert.equal(error.code, 1);
      const log = JSON.parse(error.stdout.trim());
      assert.equal(log.level, 50);
      assert.match(log.msg, /initialization failed/);
      assert.ok(log.err.message.includes(key));
      assert.ok(!error.stdout.includes(validEnv.SALT));
      assert.ok(!error.stdout.includes('Application initialized.'));
      return true;
    });
  }
});

test('invalid ports, database addresses and blank salt are rejected', async (t) => {
  const directory = await createFixture(t);
  const invalid = [
    ...['', '0', '-1', '65536', '3.5', '3000abc', 'NaN', ' '].map((PORT) => ({PORT})),
    ...['', 'localhost', '999.1.2.3', 'mongodb://127.0.0.1'].map((DB_HOST) => ({DB_HOST})),
    {SALT: ''}, {SALT: '   '}
  ];
  for (const variables of invalid) {
    await assert.rejects(run(directory, {...validEnv, ...variables}), {code: 1});
  }
});

test('pretty logs work and preserve the failure exit code', async (t) => {
  const directory = await createFixture(t);
  const {stdout} = await run(directory, validEnv, ['--pretty']);
  assert.match(stdout, /INFO/);
  assert.match(stdout, /Application initialized\. Port: 4310\./);
  await assert.rejects(run(directory, {}, ['--pretty']), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /ERROR/);
    return true;
  });
});

test('container injects replaceable dependencies and shares singleton instances', () => {
  const container = createRestContainer();
  const messages = [];
  container.rebind(Component.Logger).toConstantValue({info: (message) => messages.push(message)});
  container.rebind(Component.Config).toConstantValue({get: (key) => {
    assert.equal(key, 'PORT');
    return 4312;
  }});
  const application = container.get(Component.Application);
  assert.equal(container.get(Component.Application), application);
  assert.equal(container.get(Component.Logger), container.get(Component.Logger));
  application.init();
  assert.deepEqual(messages, ['Application initialized. Port: 4312.']);
});
