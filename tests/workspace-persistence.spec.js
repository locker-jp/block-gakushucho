// ワークスペース保存復元機能（β1②）のテスト。
// 実習別ファイルエクスポート/インポート・自動保存(localStorage)/起動時復元・
// 全件エクスポート/インポートの3需要をカバーする。
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const consoleErrors = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(String(err)));
});

test.afterEach(async () => {
  expect(consoleErrors, 'コンソールエラーが発生しないこと').toEqual([]);
});

async function openSection(page, sectionId) {
  await page.goto(`gakushucho.html#${sectionId}`);
  const container = page.locator(`#page-${sectionId} .blockly-embed-container`).first();
  await expect(container).toBeVisible();
  await expect(container.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  return container;
}

test('実習別エクスポート: 保存ボタンでJSONファイルがダウンロードされ、正しいpresetKey・ブロック情報を含む', async ({ page }) => {
  const container = await openSection(page, '1-1');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    container.locator('.btn-save-file').click(),
  ]);
  const tmpPath = path.join(os.tmpdir(), 'gakushucho-test-' + Date.now() + '.json');
  await download.saveAs(tmpPath);
  const payload = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
  fs.unlinkSync(tmpPath);

  expect(payload.app).toBe('gakushucho');
  expect(payload.presetKey).toBe('ch01-1');
  expect(payload.workspace).toBeTruthy();
  expect(Array.isArray(payload.workspace.blocks && payload.workspace.blocks.blocks)).toBe(true);
  expect(payload.workspace.blocks.blocks.length).toBeGreaterThan(0);
});

test('実習別インポート: 空のワークスペースに、以前エクスポートしたファイルを読み込むとブロックが復元される', async ({ page }) => {
  const container = await openSection(page, '1-1');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    container.locator('.btn-save-file').click(),
  ]);
  const tmpPath = path.join(os.tmpdir(), 'gakushucho-test-' + Date.now() + '.json');
  await download.saveAs(tmpPath);

  // いったんワークスペースを空にする（右クリックでの全削除に相当する操作をAPI経由で実行）
  const clearedCount = await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    const ws = el.getWorkspace();
    ws.clear();
    return ws.getAllBlocks(false).length;
  });
  expect(clearedCount).toBe(0);

  await container.locator('.input-open-file').setInputFiles(tmpPath);
  await expect(container.locator('.stage-logs')).toContainText('読み込みました');
  await expect(container.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached();
  fs.unlinkSync(tmpPath);
});

test('実習別インポート: 壊れたファイルを読み込むとエラーメッセージが表示され、コンソールエラーにはならない', async ({ page }) => {
  const container = await openSection(page, '1-1');
  const tmpPath = path.join(os.tmpdir(), 'gakushucho-broken-' + Date.now() + '.json');
  fs.writeFileSync(tmpPath, '{ this is not valid json');
  await container.locator('.input-open-file').setInputFiles(tmpPath);
  await expect(container.locator('.stage-logs')).toContainText('正しくありません');
  fs.unlinkSync(tmpPath);
});

// --- 自動保存・起動時復元（localStorage、2026-08-16） ---
// 「前の授業の続きから始める」という最多の用途・1人1台端末という最多の環境を
// 優先し、ブラウザを閉じても消えないlocalStorageを採用（ユーザー判断、
// 2026-08-16。当初sessionStorageで実装したが、共有端末という少数ケースの
// ために多数派の利便性を損なうのは望ましくないとして変更）。共有端末での
// 「前の生徒のブロックが残る」問題は、restoreInitialLayout()（🔄初期配置に
// 戻す、確認ダイアログ付き）で手動対処する設計に変更した。

test('自動保存: ブロックを追加して少し待つとlocalStorageに保存され、ページ再読み込み後も復元される', async ({ page }) => {
  const container = await openSection(page, '1-1');
  const before = await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    return el.getWorkspace().getAllBlocks(false).length;
  });

  // 既存ブロックを複製して1つ追加する（loadWorkspaceState経由なので正規のイベントが発火する）
  await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    const state = el.saveWorkspaceState();
    const clone = JSON.parse(JSON.stringify(state.blocks.blocks[0]));
    clone.id = 'test-added-block';
    clone.x = 300; clone.y = 300;
    delete clone.next; // 元ブロックの"next"連結先を道連れにしないよう切り離す
    state.blocks.blocks.push(clone);
    el.loadWorkspaceState(state);
  });
  await page.waitForTimeout(800); // 自動保存のデバウンス(500ms)を待つ

  const saved = await page.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'));
  expect(saved).toBeTruthy();
  const savedTopLevelCount = JSON.parse(saved).blocks.blocks.length;
  const liveAllBlocksCount = await page.evaluate(() => document.querySelector('#page-1-1 blockly-lab').getWorkspace().getAllBlocks(false).length);
  expect(liveAllBlocksCount).toBeGreaterThan(before); // 全ブロック数(next連結含む)で増加を確認
  expect(savedTopLevelCount).toBeGreaterThanOrEqual(2); // 追加した独立ブロックがトップレベルに1つ増えている

  await page.reload();
  await expect(page.locator('#page-1-1 .blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  const afterReload = await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    return el.getWorkspace().getAllBlocks(false).length;
  });
  expect(afterReload).toBeGreaterThan(before);
});

test('自動保存: 別のブラウザコンテキスト（＝別端末・別プロファイルに相当）には保存内容が引き継がれない', async ({ page, browser }) => {
  // localStorageも通常のブラウザ仕様通りプロファイル単位で分離される。ただし
  // 「同じブラウザプロファイルを共有端末で使い回す」ケースでは分離されない
  // （その場合の対処はrestoreInitialLayout()を参照）。
  const container = await openSection(page, '1-1');
  await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    const ws = el.getWorkspace();
    ws.newBlock('sound_play').initSvg();
  });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'))).toBeTruthy();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await otherPage.goto(`gakushucho.html#1-1`);
  await expect(otherPage.locator('#page-1-1 .blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  const otherSaved = await otherPage.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'));
  expect(otherSaved).toBeNull();
  await otherContext.close();
});

// --- 「🔄 初期配置に戻す」（旧リセットボタン、2026-08-16に意味を変更） ---
// シミュレーション状態のリセットはrun()/step()の開始時に自動で行われるように
// なったため、このボタンは「ブロックをうっかり消した／散らかしすぎたので
// 教材本来の初期配置に戻したい」という需要、および共有端末で前の生徒の
// ブロックが残っている場合の対処を担う。破壊的操作のため確認ダイアログを
// 挟む。

test('初期配置に戻す: 確認ダイアログでキャンセルすると何も変わらない', async ({ page }) => {
  const container = await openSection(page, '1-1');
  page.once('dialog', dialog => dialog.dismiss());
  await container.locator('.btn-reset').click();
  await expect(container.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached();
});

test('初期配置に戻す: 確認して実行すると、ブロックが教材本来の初期配置に戻り、自動保存データも消去される', async ({ page }) => {
  const container = await openSection(page, '1-1');
  await page.evaluate(() => {
    const el = document.querySelector('#page-1-1 blockly-lab');
    el.getWorkspace().newBlock('sound_play').initSvg();
  });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'))).toBeTruthy();

  page.once('dialog', dialog => dialog.accept());
  await container.locator('.btn-reset').click();

  expect(await page.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'))).toBeNull();
  await expect(container.locator('.stage-logs')).toContainText('初期配置に戻しました');
  // 教材本来の初期配置(say_text→sound_play、2ブロック)に戻っていること
  const count = await page.evaluate(() => document.querySelector('#page-1-1 blockly-lab').getWorkspace().getAllBlocks(false).length);
  expect(count).toBe(2);
});

test('実行のたびに前回までのシミュレーション状態がリセットされる（専用リセットボタン無しで累積しない）', async ({ page }) => {
  const container = await openSection(page, '4-3'); // スコア変数を使う実習
  const runBtn = container.locator('.btn-run');
  await runBtn.click();
  await expect(runBtn).toBeEnabled({ timeout: 15000 });
  const logsAfterFirst = await container.locator('.stage-logs').innerText();
  expect(logsAfterFirst).toContain('現在 10');

  // 2回目の実行でも、1回目のスコア加算を引きずらず同じ「現在 10」になる
  await runBtn.click();
  await expect(runBtn).toBeEnabled({ timeout: 15000 });
  const logsAfterSecond = await container.locator('.stage-logs').innerText();
  expect(logsAfterSecond).toContain('現在 10');
});

// --- 全件ファイルエクスポート・インポート（top-barの💾全件保存／📂全件読込） ---

test('全件エクスポート: 複数実習ぶんの自動保存データがまとめて1ファイルにダウンロードされる', async ({ page }) => {
  await openSection(page, '1-1');
  await page.evaluate(() => document.querySelector('#page-1-1 blockly-lab').getWorkspace().newBlock('sound_play').initSvg());
  await page.waitForTimeout(800);

  await page.goto('gakushucho.html#2-1');
  const container2 = page.locator('#page-2-1 .blockly-embed-container').first();
  await expect(container2.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  await page.evaluate(() => document.querySelector('#page-2-1 blockly-lab').getWorkspace().newBlock('sound_play').initSvg());
  await page.waitForTimeout(800);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#btnAllDataExport').click(),
  ]);
  const tmpPath = path.join(os.tmpdir(), 'gakushucho-all-' + Date.now() + '.json');
  await download.saveAs(tmpPath);
  const payload = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
  fs.unlinkSync(tmpPath);

  expect(payload.app).toBe('gakushucho');
  expect(Object.keys(payload.workspaces)).toEqual(expect.arrayContaining(['ch01-1', 'ch02-1']));
});

test('全件インポート: 全件保存ファイルを読み込むと、対応するlocalStorageキーが書き戻され、開いているページにも反映される', async ({ page }) => {
  const bundle = {
    app: 'gakushucho', kind: 'all', savedAt: new Date().toISOString(),
    workspaces: { 'ch01-1': { blocks: { languageVersion: 0, blocks: [] } } },
  };
  const tmpPath = path.join(os.tmpdir(), 'gakushucho-all-import-' + Date.now() + '.json');
  fs.writeFileSync(tmpPath, JSON.stringify(bundle));

  const container = await openSection(page, '1-1');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#inputAllDataImport').setInputFiles(tmpPath);
  await page.waitForTimeout(300);

  const stored = await page.evaluate(() => localStorage.getItem('gakushucho_ws_ch01-1'));
  expect(JSON.parse(stored)).toEqual(bundle.workspaces['ch01-1']);
  // 空のブロック配列を読み込んだので、現在開いているch01-1のワークスペースも空になる
  const liveCount = await page.evaluate(() => document.querySelector('#page-1-1 blockly-lab').getWorkspace().getAllBlocks(false).length);
  expect(liveCount).toBe(0);
  fs.unlinkSync(tmpPath);
});
