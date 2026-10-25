import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {test} from 'node:test';
import {createCliContainer} from '../dist/cli/cli.container.js';
import {Component} from '../dist/shared/types/component.enum.js';

const exec = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/main.cli.js', import.meta.url));
const sample = fileURLToPath(new URL('../mocks/test-data.tsv', import.meta.url));

async function fixture(t) {
  const name = `six_cities_test_${randomUUID().replaceAll('-', '')}`;
  const address = new URL(process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017');
  address.pathname = `/${name}`;
  const uri = address.href;
  const container = createCliContainer();
  container.rebind(Component.Logger).toConstantValue({info: () => {}, error: () => {}});
  const database = container.get(Component.DatabaseClient);
  const connection = container.get(Component.Connection);
  t.after(async () => {
    try {
      if (connection.readyState === 1 && connection.name === name && name.startsWith('six_cities_test_')) {
        await connection.dropDatabase();
      }
    } finally {
      await database.disconnect();
    }
  });
  await database.connect(uri);
  return {container, connection, uri};
}

test('user service creates hashed passwords, enforces unique email and finds users', async (t) => {
  const {container} = await fixture(t);
  const users = container.get(Component.UserService);
  const model = container.get(Component.UserModel);
  const user = await users.create({name: 'Alice', email: 'ALICE@example.com', password: 'secret123', type: 'regular'});
  assert.ok(user.createdAt instanceof Date);
  assert.ok(user.updatedAt instanceof Date);
  assert.equal(user.avatar, 'avatar.svg');
  assert.equal((await users.findByEmail('ALICE@EXAMPLE.COM')).id, user.id);
  assert.equal((await users.findById(user.id)).email, 'alice@example.com');
  assert.equal((await users.findById(user.id)).password, undefined);
  const stored = await model.findById(user.id).select('+password');
  const [algorithm, salt, hash] = stored.password.split('$');
  assert.equal(algorithm, 'scrypt');
  assert.ok(timingSafeEqual(scryptSync('secret123', salt, 64), Buffer.from(hash, 'hex')));
  await assert.rejects(users.create({name: 'Another', email: 'alice@example.com', password: 'secret456', type: 'pro'}), {code: 11000});
  assert.equal(await users.findById('invalid'), null);
  assert.equal(await users.findByEmail('missing@example.com'), null);
});

test('CLI persists offers and their authors in separate collections and reuses existing users', async (t) => {
  const {container, connection, uri} = await fixture(t);
  const result = await exec(process.execPath, [cli, '--import', sample, uri]);
  assert.match(result.stdout, /Connecting to MongoDB/);
  assert.match(result.stdout, /MongoDB connection established/);
  assert.match(result.stdout, /Сохранено предложений: 2/);
  assert.match(result.stdout, /MongoDB connection closed/);
  assert.ok(!result.stdout.includes('"title":'));
  const users = container.get(Component.UserModel);
  const offers = container.get(Component.OfferModel);
  assert.equal(await users.countDocuments(), 2);
  assert.equal(await offers.countDocuments(), 2);
  const saved = await offers.findOne().populate('authorId');
  assert.ok(saved.createdAt instanceof Date && saved.updatedAt instanceof Date);
  assert.equal(saved.commentsCount, 0);
  assert.equal(saved.images.length, 6);
  assert.ok(saved.authorId.email);
  assert.equal(saved.authorId.password, undefined);
  assert.equal((await container.get(Component.OfferService).findById(saved.id)).title, saved.title);
  assert.equal(await container.get(Component.OfferService).findById('invalid'), null);
  assert.deepEqual((await connection.db.listCollections().toArray()).map(({name}) => name).sort(), ['offers', 'users']);
  await exec(process.execPath, [cli, '--import', sample, uri]);
  assert.equal(await users.countDocuments(), 2);
  assert.equal(await offers.countDocuments(), 4);
});

test('malformed TSV reports the row, preserves completed writes and closes its connection', async (t) => {
  const {container, uri} = await fixture(t);
  const directory = await mkdtemp(join(tmpdir(), 'six-cities-db-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const [header, first] = (await readFile(sample, 'utf8')).split(/\r?\n/);
  const filename = join(directory, 'invalid.tsv');
  await writeFile(filename, `${header}\n${first}\ninvalid\n`);
  await assert.rejects(exec(process.execPath, [cli, '--import', filename, uri]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /:3: Invalid column count/);
    assert.match(error.stderr, /Successfully saved: 1/);
    assert.match(error.stdout, /MongoDB connection closed/);
    return true;
  });
  assert.equal(await container.get(Component.OfferModel).countDocuments(), 1);
});

test('connection failure exits without leaking URI credentials', async () => {
  await assert.rejects(exec(process.execPath, [cli, '--import', sample, 'mongodb://private-user:private-password@127.0.0.1:1/unavailable']), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /MongoDB connection failed/);
    assert.match(error.stderr, /Cannot connect to MongoDB/);
    assert.ok(!`${error.stdout}${error.stderr}`.includes('private-password'));
    return true;
  });
});
