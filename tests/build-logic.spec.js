// build/build.js の純粋ロジック（Node側、ブラウザ不要）のユニットテスト。
// 2026-08-16、module.exports 経由で require() できるようにしたのに合わせて新設。
// ブラウザが必要な部分（Blockly実行シミュレータ、コード生成プレビュー）は
// tests/blockly-sim.spec.js / tests/code-generation.spec.js（Playwright）でカバーする。
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const build = require(path.join(__dirname, '..', 'build', 'build.js'));

test('computeContentStats: 実際のgakushucho.mdは8章24節（3節×8章）', () => {
  const sections = build.parseMasterMd();
  const stats = build.computeContentStats(sections);
  assert.equal(stats.chapterCount, 8);
  assert.equal(stats.totalSections, 24);
  for (let i = 1; i <= 8; i++) {
    const key = 'ch0' + i;
    assert.equal(stats.sectionsByChapter[key], 3, key + 'は3節のはず');
  }
});

test('computeContentStats: 合成データで章・節数を正しく集計する', () => {
  const sections = {
    ch01: '# 第1章\n本文\n\n## 1-1. A\n内容A\n\n## 1-2. B\n内容B\n',
    ch02: '# 第2章\n本文\n\n## 2-1. C\n内容C\n',
    setup: '# セットアップ\n章ではないので集計対象外\n'
  };
  const stats = build.computeContentStats(sections);
  assert.equal(stats.chapterCount, 2);
  assert.equal(stats.totalSections, 3);
  assert.equal(stats.sectionsByChapter.ch01, 2);
  assert.equal(stats.sectionsByChapter.ch02, 1);
});

test('getSortedChapterKeys: ch1/ch2のような表記ゆれも数値順に並べる', () => {
  const sections = { ch3: '', ch01: '', ch2: '', overview: '', ch10: '' };
  assert.deepEqual(build.getSortedChapterKeys(sections), ['ch01', 'ch2', 'ch3', 'ch10']);
});

test('splitChapterSections: 章冒頭の導入文はsecIdx=0、以降の## 見出しは1から連番', () => {
  const raw = '導入文（節見出しの前）\n\n## 1-1. 最初の節\n内容1\n\n## 1-2. 次の節\n内容2\n';
  const parts = build.splitChapterSections(raw);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].isChapterIntro, true);
  assert.equal(parts[0].secIdx, 0);
  assert.equal(parts[1].secIdx, 1);
  assert.equal(parts[2].secIdx, 2);
});

test('splitChapterSections: 章冒頭の導入文が無い場合はsecIdx=1から始まる', () => {
  const raw = '## 1-1. 最初の節\n内容1\n';
  const parts = build.splitChapterSections(raw);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].isChapterIntro, false);
  assert.equal(parts[0].secIdx, 1);
});

test('cleanSectionHeading: "N-M. " の番号プレフィックスを取り除く', () => {
  assert.equal(build.cleanSectionHeading('## 1-1. 最初に命令を組んでみよう'), '最初に命令を組んでみよう');
  assert.equal(build.cleanSectionHeading('## 番号なし見出し'), '番号なし見出し');
  assert.equal(build.cleanSectionHeading('本文行（見出しではない）'), null);
});

test('extractH1Title: 先頭行の"# 見出し"を抽出する', () => {
  assert.equal(build.extractH1Title('# 📦 見出しテキスト\n本文...', 'fallback'), '📦 見出しテキスト');
  assert.equal(build.extractH1Title('見出しが無い本文', 'fallback'), 'fallback');
});

test('extractH1Title: 非章セクション6件すべてで実際のgakushucho.mdの見出しを正しく抽出できる（旧titlesMapとのドリフト再発防止）', () => {
  const sections = build.parseMasterMd();
  for (const key of ['setup', 'overview', 'news', 'toc', 'appendix', 'teacher_appendix']) {
    const title = build.extractH1Title(sections[key], null);
    assert.ok(title, key + ' の見出しが抽出できない');
    assert.ok(!title.startsWith('#'), key + ' の見出しに"#"が残っている: ' + title);
  }
});

test('validatePresetReferences: 実際のgakushucho.md全体は整合している（例外を投げない）', () => {
  const sections = build.parseMasterMd();
  assert.doesNotThrow(() => build.validatePresetReferences(sections, build.PRESETS));
});

test('validatePresetReferences: 未定義キーへの参照はエラーを投げる', () => {
  const sections = { ch01: '<div class="blockly-embed" data-preset="doesnotexist" data-title="x"></div>' };
  assert.throws(() => build.validatePresetReferences(sections, build.PRESETS), /doesnotexist/);
});

test('validatePresetReferences: 定義済みキーへの参照は例外を投げない', () => {
  const sections = { ch01: '<div class="blockly-embed" data-preset="ch01-1" data-title="x"></div>' };
  assert.doesNotThrow(() => build.validatePresetReferences(sections, build.PRESETS));
});

test('PRESETS: 全キーがtoolboxXml/initXmlの両方を持つ', () => {
  for (const key of Object.keys(build.PRESETS)) {
    const preset = build.PRESETS[key];
    assert.ok(preset.toolboxXml && preset.toolboxXml.startsWith('<xml'), key + '.toolboxXml');
    assert.ok(preset.initXml && preset.initXml.startsWith('<xml') && preset.initXml.endsWith('</xml>'), key + '.initXml');
  }
});

test('mdToHtml: 見出し・箇条書き・強調を基本的なHTMLへ変換する', () => {
  const html = build.mdToHtml('# 見出し\n\n- 項目1\n- 項目2\n\n**太字**のテキスト');
  assert.match(html, /<h1[^>]*>見出し<\/h1>/);
  assert.match(html, /<li[^>]*>項目1<\/li>/);
  assert.match(html, /<strong>太字<\/strong>/);
});

test('mdToHtml: blockly-embedプレースホルダを<blockly-lab>タグへ変換する（内部構造は<blockly-lab>のconnectedCallback()側で構築されるため、ここでは短いプレースホルダのままでよい）', () => {
  const html = build.mdToHtml('<div class="blockly-embed" data-preset="ch01-1" data-title="テスト実習"></div>');
  assert.match(html, /<blockly-lab /);
  assert.match(html, /blockly-embed-container/);
  assert.match(html, /data-preset="ch01-1"/);
  assert.match(html, /data-title="テスト実習"/);
  // 以前は約40行に展開していたが、コンポーネント化により1行のプレースホルダになった
  // （実サイズ削減の直接的な確認）。
  assert.ok(html.trim().split('\n').length <= 2, 'プレースホルダは1〜2行程度のはず: ' + html);
});

test('parsePortalCards: 実際のgakushucho.mdから5枚のポータルカードを読み取れる', () => {
  const sections = build.parseMasterMd();
  const cards = build.parsePortalCards(sections);
  for (const key of ['setup', 'overview', 'news', 'teacher_appendix', 'lesson_plan']) {
    assert.ok(cards[key], key + ' のCARD定義が見つからない');
    assert.ok(cards[key].tagKind, key + '.tagKind');
    assert.ok(cards[key].title, key + '.title');
    assert.ok(cards[key].desc, key + '.desc');
  }
});

test('parsePortalCards: 合成データからkey|tagKind|title|descを正しく分解する', () => {
  const cards = build.parsePortalCards({
    portal_cards: '<!-- CARD: setup | amber | タイトルA | 説明文A -->\n<!-- CARD: overview | indigo | タイトルB | 説明文B -->'
  });
  assert.deepEqual(cards.setup, { tagKind: 'amber', title: 'タイトルA', desc: '説明文A' });
  assert.deepEqual(cards.overview, { tagKind: 'indigo', title: 'タイトルB', desc: '説明文B' });
});

test('fillCardPlaceholders: {{CH}}/{{SEC}}を実際の値に置換する', () => {
  const text = build.fillCardPlaceholders('全{{CH}}章{{SEC}}節', { chapterCount: 8, totalSections: 24 });
  assert.equal(text, '全8章24節');
});
