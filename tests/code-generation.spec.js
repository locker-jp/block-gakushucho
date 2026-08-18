// Blockly実習プリセットの「コード変換プレビュー」（DNCL/Python/JS）が、
// 実際に配置されているブロック(initXml)から正しいコード文字列を生成するかを検証する。
// tests/blockly-sim.spec.js が「実行シミュレータの挙動」を見るのに対し、
// こちらは Blockly.DNCL / Blockly.Python / Blockly.JavaScript の
// コード生成そのもの（テキスト出力の正しさ）を対象にする。
const { test, expect } = require('@playwright/test');

async function openSection(page, sectionId) {
  await page.goto(`gakushucho.html#${sectionId}`);
  const container = page.locator(`#page-${sectionId} .blockly-embed-container`).first();
  await expect(container).toBeVisible();
  await expect(container.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  return container;
}

async function getCode(container, lang) {
  if (lang && lang !== 'dncl') {
    await container.locator('.lang-tab', { hasText: lang === 'python' ? 'Python' : 'JS' }).click();
  }
  return container.locator('.code-preview-content').innerText();
}

test('ch05-1 双方向Webコンテンツ: DNCLコードにスコア初期化と画面遷移が生成される', async ({ page }) => {
  const container = await openSection(page, '5-1');
  const dncl = await getCode(container);
  expect(dncl).toContain('スコア = 0');
  expect(dncl).toContain('画面を「結果画面」にする()');
});

test('ch05-2 センサー自動制御: DNCLコードに条件式(明るさセンサーの値 < 28)が生成される', async ({ page }) => {
  const container = await openSection(page, '5-2');
  const dncl = await getCode(container);
  expect(dncl).toContain('もし 明るさセンサーの値() < 28 ならば');
  expect(dncl).toContain('LEDを点灯する()');
});

test('ch05-3 デバッグ演習: DNCLコードは不等号が逆(> 28)で生成される', async ({ page }) => {
  const container = await openSection(page, '5-3');
  const dncl = await getCode(container);
  expect(dncl).toContain('もし 明るさセンサーの値() > 28 ならば');
});

test('ch06-1 配列とループ: DNCLコードに配列リテラルとインデックスアクセスが生成される', async ({ page }) => {
  const container = await openSection(page, '6-1');
  const dncl = await getCode(container);
  expect(dncl).toContain('[85, 92, 78, 90, 88][0]');
  expect(dncl).toContain('を表示する');

  const python = await getCode(container, 'python');
  expect(python).toContain('85');
  expect(python).toContain('92');
});

test('ch06-2 関数の定義と呼び出し: DNCLコードに手続き定義と呼び出しの両方が生成される', async ({ page }) => {
  const container = await openSection(page, '6-2');
  const dncl = await getCode(container);
  expect(dncl).toContain('手続き あいさつする()');
  expect(dncl).toContain('「こんにちは、関数です！」と表示する');
  expect(dncl).toContain('手続き終わり');
  expect(dncl).toContain('あいさつする()');

  const js = await getCode(container, 'js');
  expect(js.length).toBeGreaterThan(0);
  expect(js).not.toContain('コード変換エラー');
});

test('ch06-3 基本アルゴリズム: DNCLコードに線形探索の呼び出しが実際のリスト・探す値を伴って生成される', async ({ page }) => {
  const container = await openSection(page, '6-3');
  const dncl = await getCode(container);
  expect(dncl).toContain('線形探索([85, 92, 78, 90, 88], 78)');

  const python = await getCode(container, 'python');
  expect(python).toContain('linear_search([85, 92, 78, 90, 88], 78)');
  const js = await getCode(container, 'js');
  expect(js).toContain('linearSearch([85, 92, 78, 90, 88], 78)');
});

test('[回帰] ch02-1 くり返し処理: DNCLコードに「5 回繰り返す」が生成される', async ({ page }) => {
  const container = await openSection(page, '2-1');
  const dncl = await getCode(container);
  expect(dncl).toContain('5 回繰り返す');
  expect(dncl).toContain('繰り返し終わり');
});

test('[回帰] 全プリセットでPython/JS変換エラーが出ない', async ({ page }) => {
  for (const sectionId of ['1-1', '2-2', '3-2', '4-3', '5-1', '5-2', '6-1', '6-2', '6-3', '7-2']) {
    const container = await openSection(page, sectionId);
    const python = await getCode(container, 'python');
    const js = await getCode(container, 'js');
    expect(python, `${sectionId} python`).not.toContain('コード変換エラー');
    expect(js, `${sectionId} js`).not.toContain('コード変換エラー');
  }
});
