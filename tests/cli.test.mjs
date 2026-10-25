import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {TSVFileReader} from '../dist/shared/file-reader/tsv-file-reader.js';
import {TSVFileWriter} from '../dist/shared/file-writer/tsv-file-writer.js';
import {OfferGenerator} from '../dist/shared/offer-generator.js';
import {validateMockData} from '../dist/shared/mock-data-validator.js';
import {parseOffer, TSV_HEADER} from '../dist/shared/offer-parser.js';
import {serializeOffer} from '../dist/shared/offer-serializer.js';
import 'reflect-metadata';
import {ImportCommand} from '../dist/cli/commands/import.command.js';

const exec = promisify(execFile);
const {offers} = JSON.parse(await readFile(new URL('../mocks/mock-server-data.json', import.meta.url), 'utf8'));
const cli = new URL('../dist/main.cli.js', import.meta.url);
const runCLI = (...args) => exec(process.execPath, [fileURLToPath(cli), ...args]);

async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), 'six-cities-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  return directory;
}

test('generated offers survive TSV round-trip and meet the required ranges', () => {
  validateMockData(offers);
  const generator = new OfferGenerator(offers);
  for (let index = 0; index < 1000; index++) {
    const offer = generator.generate();
    assert.deepEqual(parseOffer(serializeOffer(offer)), offer);
    assert.equal(offer.images.length, 6);
    assert.ok(offer.rating >= 1 && offer.rating <= 5);
    assert.ok(Math.abs(offer.rating * 10 - Math.round(offer.rating * 10)) < 1e-8);
    assert.ok(Number.isInteger(offer.bedrooms) && offer.bedrooms >= 1 && offer.bedrooms <= 8);
    assert.ok(Number.isInteger(offer.maxAdults) && offer.maxAdults >= 1 && offer.maxAdults <= 10);
    assert.ok(Number.isInteger(offer.price) && offer.price >= 100 && offer.price <= 100000);
    assert.ok(offer.goods.length >= 1 && new Set(offer.goods).size === offer.goods.length);
    assert.equal(offer.commentsCount, 0);
    assert.equal(offer.isFavorite, false);
  }
});

test('invalid mock responses are rejected', () => {
  for (const data of [null, {}, [], [null], [{...offers[0], images: []}],
    [{...offers[0], title: 'Invalid\ttitle'}], [{...offers[0], city: 'London'}],
    [{...offers[0], author: null}],
    [{...offers[0], author: {...offers[0].author, name: 'a'.repeat(16)}}],
    [{...offers[0], author: {...offers[0].author, email: 'invalid-email'}}],
    [{...offers[0], author: {...offers[0].author, avatar: 'invalid\nimage.jpg'}}],
    [{...offers[0], images: [...offers[0].images.slice(0, 5), 'invalid;image.jpg']}]]) {
    assert.throws(() => validateMockData(data));
  }
});

test('reader preserves UTF-8 across chunks, BOM, CRLF, empty lines and final line without LF', async (t) => {
  const directory = await temporary(t);
  const filename = join(directory, 'boundary.tsv');
  const longLine = 'Я'.repeat(40000);
  await writeFile(filename, `\uFEFF${longLine}\r\n\r\nlast`);
  const actual = [];
  for await (const line of new TSVFileReader(filename).read()) {
    actual.push(line);
  }
  assert.deepEqual(actual, [longLine, '', 'last']);
  await writeFile(filename, '');
  for await (const line of new TSVFileReader(filename).read()) {
    assert.fail(`Unexpected line: ${line}`);
  }
});

test('CLI generates from HTTP and validates generation parameters', async (t) => {
  const directory = await temporary(t);
  const filename = join(directory, 'offers.tsv');
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(request.url === '/offers' ? offers : {}));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = `http://127.0.0.1:${server.address().port}`;
  const generated = await runCLI('--generate', '20', filename, `${address}/offers`);
  assert.match(generated.stdout, /Создано предложений: 20/);
  assert.equal((await readFile(filename, 'utf8')).trimEnd().split('\n').length, 21);
  const original = await readFile(filename, 'utf8');
  for (const count of ['0', '-1', '1.5', 'NaN', '9007199254740992']) {
    await assert.rejects(runCLI('--generate', count, filename, `${address}/offers`), {code: 1});
  }
  await assert.rejects(runCLI('--generate', '1', filename, `${address}/invalid`), {code: 1});
  assert.equal(await readFile(filename, 'utf8'), original);
  await assert.rejects(runCLI('--generate', '1', filename, 'file:///data'), {code: 1});
});

test('file errors and malformed rows report failure with the line number', async (t) => {
  const directory = await temporary(t);
  const filename = join(directory, 'offers.tsv');
  await assert.rejects(runCLI('--import', filename), {code: 1});
  const line = serializeOffer(new OfferGenerator(offers).generate());
  await new TSVFileWriter(filename).write([`${TSV_HEADER}\n`, `${line}\n`, 'invalid\n']);
  let disconnected = false;
  const saved = [];
  const importer = new ImportCommand(
    {connect: async () => {}, disconnect: async () => { disconnected = true; }},
    {findByEmail: async () => ({id: 'author-id'})},
    {create: async (offer) => saved.push(offer)},
    {info: () => {}}
  );
  await assert.rejects(importer.execute(filename, 'mongodb://127.0.0.1/test'), (error) => {
    assert.match(error.message, /:3: Invalid column count/);
    assert.match(error.message, /Successfully saved: 1/);
    return true;
  });
  assert.equal(disconnected, true);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].authorId, 'author-id');
  await assert.rejects(new TSVFileWriter(directory).write(['test\n']));
});
