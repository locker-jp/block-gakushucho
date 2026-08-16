// Blockly実習シミュレータ(▶実行/⏯コマ送り)の動作確認テスト。
// 2026-08-16、runBlocklyDemo/stepBlocklyDemoを「入れ子ブロックを実行しない」
// 「container._blocklyWorkspaceが常にundefinedでコマ送りが完全に無反応」
// という不具合から書き直した際の回帰テスト。
const { test, expect } = require('@playwright/test');

const consoleErrors = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(String(err)));
});

test.afterEach(async () => {
  expect(consoleErrors, 'コンソールエラーが発生しないこと').toEqual([]);
});

/** 指定ページIDへ移動し、Blocklyワークスペースが初期化されるまで待つ */
async function openSection(page, sectionId) {
  await page.goto(`gakushucho.html?teach=1#${sectionId}`);
  const container = page.locator(`#page-${sectionId} .blockly-embed-container`).first();
  await expect(container).toBeVisible();
  // Blockly.injectはページがactiveになった時点で実行される。ブロックが描画されるまで待つ。
  await expect(container.locator('.blockly-workspace-div .blocklyDraggable').first()).toBeAttached({ timeout: 10000 });
  return container;
}

/** ▶実行ボタンを押し、完了（ボタンが再度有効化）するまで待ってログ全文を返す */
async function runAndGetLogs(container) {
  const runBtn = container.locator('.btn-run');
  await runBtn.click();
  await expect(runBtn).toBeEnabled({ timeout: 15000 });
  await expect(runBtn).toHaveText('▶ 実行');
  return container.locator('.stage-logs').innerText();
}

test('ch05-1 双方向Webコンテンツ: ボタン→スコア初期化→画面遷移が実行される', async ({ page }) => {
  const container = await openSection(page, '5-1');
  const logs = await runAndGetLogs(container);
  expect(logs).toContain('ボタンが押されました');
  expect(logs).toContain('スコアを 0 にしました');
  expect(logs).toContain('画面を「結果画面」にしました');
});

test('ch05-2 センサー自動制御: 条件が成立しLEDが点灯する', async ({ page }) => {
  const container = await openSection(page, '5-2');
  await runAndGetLogs(container);
  await expect(container.locator('.stage-led')).toHaveClass(/on/);
});

test('ch05-3 デバッグ演習: 比較演算子が逆なのでLEDは点灯しない（バグの再現）', async ({ page }) => {
  const container = await openSection(page, '5-3');
  await runAndGetLogs(container);
  await expect(container.locator('.stage-led')).not.toHaveClass(/on/);
});

test('ch06-1 配列とループ: リストの先頭要素「85」が表示される（こんにちは！ではない）', async ({ page }) => {
  const container = await openSection(page, '6-1');
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('85');
});

test('ch06-2 関数の定義と呼び出し: 関数本体のsay_textが実際に実行される', async ({ page }) => {
  const container = await openSection(page, '6-2');
  const logs = await runAndGetLogs(container);
  expect(logs).toContain('あいさつする');
  await expect(container.locator('.stage-speech')).toHaveText('こんにちは、関数です！');
});

test('ch06-3 基本アルゴリズム: 線形探索で[85,92,78,90,88]から78を探すと位置2が表示される', async ({ page }) => {
  const container = await openSection(page, '6-3');
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('2');
});

test('ch07-2 自由制作: 初期メッセージが表示される', async ({ page }) => {
  const container = await openSection(page, '7-2');
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('ここから自由に作ってみよう！');
});

// --- 既存（第1〜4章）プリセットの回帰確認：入れ子ブロックの実行が壊れていないか ---

test('[回帰] ch02-2 条件分岐: logic_boolean(TRUE)でsound_playが実行される', async ({ page }) => {
  const container = await openSection(page, '2-2');
  const logs = await runAndGetLogs(container);
  expect(logs).toContain('音を鳴らす');
});

test('[回帰] ch02-1 くり返し処理: 5回のplay_meowが展開されて実行される', async ({ page }) => {
  const container = await openSection(page, '2-1');
  const logs = await runAndGetLogs(container);
  const count = (logs.match(/ニャーと鳴く/g) || []).length;
  expect(count).toBe(5);
});

test('[回帰] ch04-3 スコア変数: 設定と加算が反映される', async ({ page }) => {
  const container = await openSection(page, '4-3');
  const logs = await runAndGetLogs(container);
  expect(logs).toContain('スコアを 0 にしました');
  expect(logs).toContain('現在 10');
});

// --- コマ送り（従来 container._blocklyWorkspace が常に undefined で完全無反応だったバグの確認） ---

test('[回帰] コマ送りが1ステップずつ反応する（以前は完全に無反応だった）', async ({ page }) => {
  const container = await openSection(page, '1-1');
  const stepBtn = container.locator('.btn-step');
  const logsBefore = await container.locator('.stage-logs').innerText();
  await stepBtn.click();
  await expect(container.locator('.stage-logs')).not.toHaveText(logsBefore);
  const logsAfter = await container.locator('.stage-logs').innerText();
  expect(logsAfter).toContain('1ステップ');
});

test('[回帰] センサー値の＋/－ボタンで表示中の値が変わる', async ({ page }) => {
  const container = await openSection(page, '5-2');
  const valueSpan = container.locator('.stage-sensor-value');
  await expect(valueSpan).toHaveText('15');
  await container.locator('.stage-sensor-row button', { hasText: '＋' }).click();
  await expect(valueSpan).toHaveText('20');
});

// --- LED・ボタンの表示方針（「配置して実行中だけ表示、実行終了で非表示」、2026-08-16） ---

test('LED・ボタン: 該当ブロックを使う実習でも、実行前は非表示で実行中のみ表示される', async ({ page }) => {
  const container = await openSection(page, '5-1'); // event_buttonを使う実習
  const buttonRow = container.locator('.stage-button-row');
  await expect(buttonRow).toBeHidden();

  const runBtn = container.locator('.btn-run');
  await runBtn.click();
  await expect(buttonRow).toBeVisible();
  await expect(runBtn).toBeEnabled({ timeout: 15000 });
  await expect(buttonRow).toBeHidden();
});

test('LED: sensor_light/led_onを使わない実習(ch01-1)ではLEDが常に非表示', async ({ page }) => {
  const container = await openSection(page, '1-1');
  await expect(container.locator('.stage-led')).toBeHidden();
  await runAndGetLogs(container);
  await expect(container.locator('.stage-led')).toBeHidden();
});

test('光センサー: LED・ボタンと異なり、実行前から常に表示される（値を実行前に設定する必要があるための例外）', async ({ page }) => {
  const container = await openSection(page, '5-2');
  await expect(container.locator('.stage-sensor-row')).toBeVisible();
});

test('画面遷移: screen_switch実行時にステージへ画面名バナーが表示される', async ({ page }) => {
  const container = await openSection(page, '5-1');
  const banner = container.locator('.stage-screen-banner');
  await expect(banner).not.toHaveClass(/visible/);
  await runAndGetLogs(container);
  await expect(banner).toHaveClass(/visible/);
  await expect(banner).toContainText('結果画面');
});

// --- アルゴリズムブロック（線形探索・二分探索・バブルソート、2026-08-16新設） ---
// ch06-3のPRESETSは線形探索のみを実演するため、二分探索・バブルソートは
// loadWorkspaceStateで直接ワークスペースを差し替えて実行結果の正しさを検証する。

function numberBlock(id, num) {
  return { block: { type: 'math_number', id: id, fields: { NUM: num } } };
}
function listBlock(id, nums) {
  const inputs = {};
  nums.forEach((n, i) => { inputs['ADD' + i] = numberBlock(id + '-n' + i, n); });
  return { block: { type: 'lists_create_with', id: id, extraState: { itemCount: nums.length }, inputs: inputs } };
}

test('algo_binary_search: 整列済みリスト[10,20,30,40,50]から40を探すと位置3が表示される', async ({ page }) => {
  const container = await openSection(page, '6-3');
  await page.evaluate((state) => {
    const el = document.querySelector('#page-6-3 blockly-lab');
    el.loadWorkspaceState(state);
  }, {
    blocks: { languageVersion: 0, blocks: [{
      type: 'text_print', id: 'root', x: 30, y: 30,
      inputs: { TEXT: { block: {
        type: 'algo_binary_search', id: 'bs',
        inputs: { LIST: listBlock('list', [10, 20, 30, 40, 50]), TARGET: numberBlock('target', 40) }
      } } }
    }] }
  });
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('3');
});

test('algo_binary_search: 見つからない場合は-1が表示される', async ({ page }) => {
  const container = await openSection(page, '6-3');
  await page.evaluate((state) => {
    document.querySelector('#page-6-3 blockly-lab').loadWorkspaceState(state);
  }, {
    blocks: { languageVersion: 0, blocks: [{
      type: 'text_print', id: 'root', x: 30, y: 30,
      inputs: { TEXT: { block: {
        type: 'algo_binary_search', id: 'bs',
        inputs: { LIST: listBlock('list', [10, 20, 30, 40, 50]), TARGET: numberBlock('target', 99) }
      } } }
    }] }
  });
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('-1');
});

test('algo_bubble_sort: [5,3,4,1,2]を並べ替えると1,2,3,4,5が表示される', async ({ page }) => {
  const container = await openSection(page, '6-3');
  await page.evaluate((state) => {
    document.querySelector('#page-6-3 blockly-lab').loadWorkspaceState(state);
  }, {
    blocks: { languageVersion: 0, blocks: [{
      type: 'text_print', id: 'root', x: 30, y: 30,
      inputs: { TEXT: { block: { type: 'algo_bubble_sort', id: 'sort', inputs: { LIST: listBlock('list', [5, 3, 4, 1, 2]) } } } }
    }] }
  });
  await runAndGetLogs(container);
  await expect(container.locator('.stage-speech')).toHaveText('1,2,3,4,5');
});
