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

test('extractH1Title: toc（唯一H1見出しを残す非章セクション）で実際のgakushucho.mdの見出しを正しく抽出できる（旧titlesMapとのドリフト再発防止）', () => {
  const sections = build.parseMasterMd();
  const title = build.extractH1Title(sections.toc, null);
  assert.ok(title, 'toc の見出しが抽出できない');
  assert.ok(!title.startsWith('#'), 'toc の見出しに"#"が残っている: ' + title);
});

test('splitAppendixSections: gakushucho.mdの実データで巻末付録（appendix/overview/setup/news/teacher_appendix）が付録A〜Kとして節ごとに1ページへ分割される', () => {
  const sections = build.parseMasterMd();
  const groups = {
    appendix: ['appendix_a', 'appendix_b'],
    overview: ['appendix_c', 'appendix_d'],
    setup: ['appendix_e', 'appendix_f'],
    news: ['appendix_g', 'appendix_h'],
    teacher_appendix: ['appendix_i', 'appendix_j', 'appendix_k'],
  };
  const allPages = [];
  for (const [key, expectedIds] of Object.entries(groups)) {
    const pages = build.splitAppendixSections(sections[key]);
    assert.deepEqual(pages.map(p => p.pageId), expectedIds, key + 'のページID構成が想定と異なる');
    allPages.push(...pages);
  }
  for (const p of allPages) {
    assert.ok(p.pageTitle.startsWith('付録'), p.pageId + ' のタイトルが"付録"から始まらない: ' + p.pageTitle);
    assert.ok(p.part.trim().startsWith('## '), p.pageId + ' の本文が見出し行から始まらない');
  }
});

test('splitFlatSections: gakushucho.mdの実データでtoc（巻末付録の通し番号に含まれない唯一のセクション）が水平線区切りの節ごとに1ページへ分割される', () => {
  const sections = build.parseMasterMd();
  const pages = build.splitFlatSections('toc', sections.toc);
  assert.ok(pages.length > 1, 'tocが1ページのまま分割されていない');
  // 先頭ページのIDはキーそのもの（index.html等の既存リンク #setup / #news との後方互換のため）。
  assert.equal(pages[0].pageId, 'toc');
  for (let i = 1; i < pages.length; i++) {
    assert.equal(pages[i].pageId, `toc_${i}`);
    assert.ok(pages[i].part.trim().startsWith('## '), pages[i].pageId + ' の本文が見出し行から始まらない');
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

test('fillCardPlaceholders: {{CH}}/{{SEC}}を実際の値に置換する', () => {
  const text = build.fillCardPlaceholders('全{{CH}}章{{SEC}}節', { chapterCount: 8, totalSections: 24 });
  assert.equal(text, '全8章24節');
});
