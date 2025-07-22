import { test } from 'node:test';
import assert from 'node:assert/strict';
import { printBuffer, printPngFile } from '../dist/brother.js';
import * as ipp from './mocks/@sealsystems/ipp/index.js';
import * as pngparse from './mocks/pngparse/index.js';

test('printPngFile export exists', () => {
  assert.equal(typeof printPngFile, 'function');
});

test('printBuffer export exists', () => {
  assert.equal(typeof printBuffer, 'function');
});

test('printPngFile uses mocks to print a file', async () => {
  ipp.calls.length = 0;
  pngparse.files.length = 0;

  const job = await printPngFile('http://localhost:631/ipp/print', 'file.png');

  assert.deepEqual(pngparse.files, ['file.png']);
  assert.equal(ipp.calls[0].operation, 'Get-Printer-Attributes');
  assert.equal(ipp.calls[1].operation, 'Print-Job');
  assert.equal(ipp.calls[2].operation, 'Get-Job-Attributes');
  assert.equal(job['job-attributes-tag']['job-id'], 1);
});

test('printBuffer prints a supplied buffer', async () => {
  ipp.calls.length = 0;
  pngparse.files.length = 0;

  const job = await printBuffer('http://localhost:631/ipp/print', Buffer.from([1]));

  assert.deepEqual(pngparse.files, ['<buffer>']);
  assert.equal(ipp.calls[0].operation, 'Get-Printer-Attributes');
  assert.equal(ipp.calls[1].operation, 'Print-Job');
  assert(ipp.calls[1].args.data instanceof Buffer);
  assert.equal(ipp.calls[2].operation, 'Get-Job-Attributes');
  assert.equal(job['job-attributes-tag']['job-id'], 1);
});
