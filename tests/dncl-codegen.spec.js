// Blockly.DNCL（js/dncl_compressed.js）の生成関数を、ブラウザ無し(jsdom + Node)で
// 直接ユニットテストする層。tests/code-generation.spec.js（Playwright、実ブラウザで
// gakushucho.htmlを開いてコード変換プレビューのテキストを見る）と違い、こちらは
// build.js のPRESETS（実データ、Playwright側とも共有する単一の情報源）をワークス
// ペースに直接読み込み、Blockly.DNCL.workspaceToCode() を直接呼び出して検証する。
//
// js/*_compressed.js は標準的なUMDラッパーで、Node(CommonJS)環境では
// module.exports = factory(require('./blockly_compressed.js')) という形の
// require()チェーンに正式対応している（ブラウザ専用ではない）。ただしXML→
// ワークスペース変換にはDOMParserが必要なため、jsdomのDOMParserを
// Blockly.utils.xml.injectDependencies() で注入する（Blockly本家のテスト
// スイート自身が使う、公式に用意された差し替え口）。
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const rootDir = path.join(__dirname, '..');
const build = require(path.join(rootDir, 'build', 'build.js'));

let Blockly;

before(() => {
  const { window } = new JSDOM('');
  Blockly = require(path.join(rootDir, 'js', 'blockly_compressed.js'));
  Blockly.utils.xml.injectDependencies({
    document: window.document,
    DOMParser: window.DOMParser,
    XMLSerializer: window.XMLSerializer,
  });
  // 標準ブロックのmessage0は %{BKY_...} 形式でBlockly.Msgのキーを参照するため、
  // 日本語メッセージ定義を読み込んでおかないと「Message does not reference all N arg(s)」
  // という誤ったエラーになる（未解決のプレースホルダ文字列のまま引数参照チェックされるため）。
  Object.assign(Blockly.Msg, require(path.join(rootDir, 'js', 'msg', 'ja.js')));
  require(path.join(rootDir, 'js', 'blocks_compressed.js'));
  // dncl_compressed.js は（blocks/javascript/python_compressed.jsと異なり）UMDの
  // require()引数チェーンではなく、bareな"Blockly"グローバルを直接参照するIIFEとして
  // 実装されている（このファイルはプロジェクト独自実装であり、Google製のUMDビルドとは
  // 構造が異なる）。Node側では globalThis.Blockly を明示的に揃えてから読み込む必要がある。
  global.Blockly = Blockly;
  require(path.join(rootDir, 'js', 'dncl_compressed.js'));
  Blockly.defineBlocksWithJsonArray(build.CUSTOM_BLOCKS);
});

function workspaceFromXml(xmlText) {
  const workspace = new Blockly.Workspace();
  const dom = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.domToWorkspace(dom, workspace);
  return workspace;
}

function dnclOf(presetKey) {
  const preset = build.PRESETS[presetKey];
  assert.ok(preset, presetKey + ' がPRESETSに無い');
  const workspace = workspaceFromXml(preset.initXml);
  return Blockly.DNCL.workspaceToCode(workspace);
}

test('PRESETS: 全20プリセットがDNCLコードへ例外なく変換できる', () => {
  for (const key of Object.keys(build.PRESETS)) {
    assert.doesNotThrow(() => dnclOf(key), key + ' の変換で例外が発生');
  }
});

test('ch05-1 双方向Webコンテンツ: DNCLコードにスコア初期化と画面遷移が生成される', () => {
  const dncl = dnclOf('ch05-1');
  assert.match(dncl, /スコア = 0/);
  assert.match(dncl, /画面を「結果画面」にする\(\)/);
});

test('ch05-2 センサー自動制御: DNCLコードに条件式(明るさセンサーの値 < 28)が生成される', () => {
  const dncl = dnclOf('ch05-2');
  assert.match(dncl, /もし 明るさセンサーの値\(\) < 28 ならば/);
  assert.match(dncl, /LEDを点灯する\(\)/);
});

test('ch05-3 デバッグ演習: DNCLコードは不等号が逆(> 28)で生成される', () => {
  const dncl = dnclOf('ch05-3');
  assert.match(dncl, /もし 明るさセンサーの値\(\) > 28 ならば/);
});

test('ch06-1 配列とループ: DNCLコードに配列リテラルとインデックスアクセスが生成される', () => {
  const dncl = dnclOf('ch06-1');
  assert.ok(dncl.includes('[85, 92, 78, 90, 88][0]'));
  assert.match(dncl, /を表示する/);
});

test('ch06-2 関数の定義と呼び出し: DNCLコードに手続き定義と呼び出しの両方が生成される', () => {
  const dncl = dnclOf('ch06-2');
  assert.ok(dncl.includes('手続き あいさつする()'));
  assert.ok(dncl.includes('「こんにちは、関数です！」と表示する'));
  assert.ok(dncl.includes('手続き終わり'));
  assert.ok(dncl.includes('あいさつする()'));
});

test('ch06-3 基本アルゴリズム: DNCLコードに線形探索の呼び出しが実際のリスト・探す値を伴って生成される', () => {
  const dncl = dnclOf('ch06-3');
  assert.ok(dncl.includes('線形探索([85, 92, 78, 90, 88], 78)'));
});

test('[回帰] ch02-1 くり返し処理: DNCLコードに「5 回繰り返す」が生成される', () => {
  const dncl = dnclOf('ch02-1');
  assert.ok(dncl.includes('5 回繰り返す'));
  assert.ok(dncl.includes('繰り返し終わり'));
});

test('algo_binary_search: DNCLコードに整列済みリスト・探す値を伴って生成される', () => {
  const xml = '<xml><block type="algo_binary_search"><value name="LIST"><block type="lists_create_with"><mutation items="1"></mutation><value name="ADD0"><block type="math_number"><field name="NUM">10</field></block></value></block></value><value name="TARGET"><block type="math_number"><field name="NUM">10</field></block></value></block></xml>';
  const workspace = workspaceFromXml(xml);
  const dncl = Blockly.DNCL.workspaceToCode(workspace);
  assert.ok(dncl.includes('二分探索([10], 10)'), dncl);
});

test('algo_bubble_sort: DNCLコードにリストを伴って生成される', () => {
  const xml = '<xml><block type="algo_bubble_sort"><value name="LIST"><block type="lists_create_with"><mutation items="1"></mutation><value name="ADD0"><block type="math_number"><field name="NUM">5</field></block></value></block></value></block></xml>';
  const workspace = workspaceFromXml(xml);
  const dncl = Blockly.DNCL.workspaceToCode(workspace);
  assert.ok(dncl.includes('バブルソート([5])'), dncl);
});
