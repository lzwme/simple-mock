import test from 'ava';
import fs from 'fs';
import path from 'path';
import utils from './utils';
import utilsDir from './utils-dir';
// import path from 'path';

test('utils.getDataFilePath', (t) => {
  let p = utils.getDataFilePath('abc', 'autosave');
  t.is(p.includes('autosave'), true);

  p = utils.getDataFilePath('abc', 'customdata');
  t.is(p.includes('customdata'), true);

  p = utils.getDataFilePath('abc');
  t.is(p.includes('mockdata'), true);

  p = utils.getDataFilePath('');
  t.is(p.includes('mockdata'), true);
});

test('utils.isExists', (t) => {
  const testDir = './test-12345';
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  t.is(utils.isExists(testDir), true);
  fs.rmdirSync(testDir);
  t.is(utils.isExists(testDir), false);
});

test('utils.isSupportTs', (t) => {
  t.is(typeof utils.isSupportTs() === 'boolean', true);
});

test('utils.isNull', (t) => {
  [null, void 0].forEach((v) => t.is(utils.isNull(v), true));
  ['', NaN, 0, 1, -1, 0.1, 'abc'].forEach((v) => t.is(utils.isNull(v), false));
});

test('utils.getFileName', (t) => {
  let r = utils.getFileName({}, {}, null, 'filename', null);
  t.is(r, 'filename');

  r = utils.getFileName(
    {
      customSaveFileName: () => 'abc',
    },
    null,
    null,
    null,
    null
  );
  t.is(r, 'abc');

  const mockReqs = [{ pathname: 'abc' }, { _parsedUrl: { pathname: 'abc' } }, { url: 'abc?t=1' }];

  mockReqs.forEach((req) => {
    r = utils.getFileName({}, req, null, null, null);
    t.is(r, 'abc');
  });
});

test('utilsDir', (t) => {
  const dirName = './test/abc';

  // 创建目录
  utilsDir.mkDir(dirName);
  t.is(fs.existsSync(dirName), true);

  fs.writeFileSync(path.resolve(dirName, 'test.test'), 'test');
  fs.writeFileSync(path.resolve(dirName, 'test.txt'), 'test');

  // 按后缀名称删除
  utilsDir.delDir(dirName, '.test');

  // 支持删除一个文件
  t.is(utilsDir.delDir(path.resolve(dirName, 'test.txt')), 1);

  // 全部删除
  t.is(utilsDir.delDir(dirName), 0);
  t.is(fs.existsSync(dirName), false);

  // 删除不存在的目录
  t.is(utilsDir.delDir(dirName), 0);
});
