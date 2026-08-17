// index.html / gakushucho.html 内の内部リンク（ページID・付属ファイル）と、
// LICENSE・README・正本md・開発資料内の外部URLが実際に有効かを検証する。
// 内部リンクはビルド出力の整合性チェック（常に実行）、外部リンクはネットワーク
// 到達性チェック（外部ネットワークに到達できない環境では丸ごとスキップする）。
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

function extractHrefs(html) {
  const hrefs = new Set();
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) hrefs.add(m[1]);
  return [...hrefs];
}

function getPageIds(html) {
  const ids = new Set();
  const re = /id="page-([a-zA-Z0-9_-]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return ids;
}

test('内部リンク: index.htmlのhrefが全て実在するページ・ファイルを指している', () => {
  const html = read('index.html');
  const gakushuchoIds = getPageIds(read('gakushucho.html'));
  for (const href of extractHrefs(html)) {
    if (/^https?:\/\//.test(href)) continue; // 外部URLは別テストで検証
    if (href.startsWith('gakushucho.html')) {
      const hashIdx = href.indexOf('#');
      if (hashIdx >= 0) {
        const key = href.slice(hashIdx + 1);
        assert.ok(gakushuchoIds.has(key), `index.html→gakushucho.html#${key} に対応するページIDが無い (href="${href}")`);
      }
      continue;
    }
    if (href === 'gakushucho.zip') {
      assert.ok(fs.existsSync(path.join(rootDir, 'gakushucho.zip')), 'gakushucho.zip が存在しない');
      continue;
    }
    assert.fail(`未知のリンク形式: href="${href}"（チェッカー側の対応漏れの可能性、要確認）`);
  }
});

test('内部リンク: gakushucho.html内のhrefが全て実在するアンカー・付属ファイルを指している', () => {
  const html = read('gakushucho.html');
  const pageIds = getPageIds(html);
  for (const href of extractHrefs(html)) {
    if (/^https?:\/\//.test(href)) continue;
    if (href.startsWith('#')) {
      const key = href.slice(1);
      assert.ok(pageIds.has(key), `href="${href}" に対応する id="page-${key}" が無い`);
      continue;
    }
    if (href === 'index.html') {
      assert.ok(fs.existsSync(path.join(rootDir, 'index.html')), 'index.html が存在しない');
      continue;
    }
    if (href.startsWith('worksheets/')) {
      assert.ok(fs.existsSync(path.join(rootDir, href)), `${href} が存在しない`);
      continue;
    }
    assert.fail(`未知のリンク形式: href="${href}"（チェッカー側の対応漏れの可能性、要確認）`);
  }
});

test('外部リンク: 独自コンテンツ（LICENSE/README/正本md/build.js/DNCLエンジン）内のURLが到達可能', { timeout: 60000 }, async (t) => {
  // build/devel/*.md（開発者向け変更履歴）は対象外。過去に検出したリンク切れの
  // URL文字列そのものを記録として書き残す運用のため、含めると自分自身の記録に
  // よって永久に失敗し続けてしまう（自己参照的な誤検知）。
  const files = [
    'LICENSE', 'NOTICE', 'README.md',
    'build/gakushucho.md',
    'build/build.js', 'js/dncl_compressed.js',
  ];
  // xmlns="..." のXML名前空間URIは実在確認の対象外（規約上リンク先が実在する必要はない）。
  const re = /(?<!xmlns=")https?:\/\/[a-zA-Z0-9][a-zA-Z0-9./_?=&%#~-]*/g;
  const urls = new Set();
  for (const f of files) {
    const text = read(f);
    let m;
    while ((m = re.exec(text)) !== null) urls.add(m[0].replace(/[.,)]+$/, ''));
  }

  let networkAvailable = true;
  try {
    await fetch('https://github.com/', { method: 'HEAD', signal: AbortSignal.timeout(8000) });
  } catch {
    networkAvailable = false;
  }
  if (!networkAvailable) {
    t.skip('外部ネットワークに到達できない環境のため、外部リンクチェックをスキップした');
    return;
  }

  // リポジトリは現在(preβ/β0)は非公開設定。正式β版(β1)達成時に公開予定のため、
  // それまでは未認証アクセスで404になるのが仕様上の正常な応答（2026-08-16、ユーザー確認済み）。
  // 公開後はこの除外を削除すること。
  const knownPrivateUntilBeta1 = new Set([
    'https://github.com/locker-jp/block-gakushucho.git',
  ]);

  const failures = [];
  for (const url of urls) {
    if (knownPrivateUntilBeta1.has(url)) continue;
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000) });
      }
      if (!res.ok) failures.push(url + ' -> HTTP ' + res.status);
    } catch (e) {
      failures.push(url + ' -> ' + ((e.cause && e.cause.message) || e.message));
    }
  }
  assert.deepEqual(failures, [], '到達できない外部URL:\n' + failures.join('\n'));
});
