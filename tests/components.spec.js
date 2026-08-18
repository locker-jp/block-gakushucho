// 新設したWeb Components（gakushu-table / gakushu-note / gakushu-tag / blockly-lab）の
// 定義そのものと、代表的な描画結果を確認するテスト。
const { test, expect } = require('@playwright/test');

test('gakushu-table: customized built-in elementとして定義され、表内容が失われない', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('gakushucho_teach.html#news');
  const defined = await page.evaluate(() => !!customElements.get('gakushu-table'));
  expect(defined).toBe(true);

  const table = page.locator('#page-news table.gakushu-table').first();
  await expect(table).toBeVisible();
  // HTML5パーサーはtr/th/tdを実際の<table>の中でないと破棄するため、
  // 中身（セルのテキスト）が実際に残っていることを直接確認する。
  await expect(table.locator('tr').first()).toContainText('日付');
  await expect(table.locator('tr').nth(1).locator('td').first()).toHaveText('2026/07/30');
  const borderCollapse = await table.evaluate(el => getComputedStyle(el).borderCollapse);
  expect(borderCollapse).toBe('collapse');
  expect(errors).toEqual([]);
});

test('gakushu-table: index.htmlのお知らせ表も同じスタイルで描画される', async ({ page }) => {
  await page.goto('index.html');
  const table = page.locator('table.gakushu-table').first();
  await expect(table).toBeVisible();
  await expect(table.locator('tr').nth(1).locator('td').first()).toContainText('2026/07/30');
});

test('gakushu-note: 定義済みで、指導案注釈が指導者用ファイルでは表示され、学習者用ファイルには出力自体されない', async ({ page }) => {
  await page.goto('gakushucho_teach.html#1-1');
  const defined = await page.evaluate(() => !!customElements.get('gakushu-note'));
  expect(defined).toBe(true);

  const note = page.locator('#page-1-1 gakushu-note.teacher-guide-annotation').first();
  await expect(note).toBeVisible();
  await expect(note).toHaveAttribute('kind', 'success');
  const bg = await note.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(240, 253, 244)'); // #f0fdf4

  await page.goto('gakushucho.html#1-1');
  await expect(page.locator('#page-1-1 gakushu-note.teacher-guide-annotation')).toHaveCount(0);
});

test('gakushu-note: kind別に異なる配色で描画される（お知らせ=amber、セットアップ=highlight）', async ({ page }) => {
  await page.goto('index.html');
  const announcement = page.locator('gakushu-note[kind="announcement"]').first();
  const highlight = page.locator('gakushu-note[kind="highlight"]').first();
  await expect(announcement).toBeVisible();
  await expect(highlight).toBeVisible();
  const announcementBorder = await announcement.evaluate(el => getComputedStyle(el).borderLeftColor);
  const highlightBorder = await highlight.evaluate(el => getComputedStyle(el).borderColor);
  expect(announcementBorder).toBe('rgb(245, 158, 11)'); // #f59e0b
  expect(highlightBorder).toBe('rgb(37, 99, 235)'); // var(--primary-color)
});

test('gakushu-tag: kindごとに正しい配色でバッジが描画される', async ({ page }) => {
  await page.goto('index.html');
  const defined = await page.evaluate(() => !!customElements.get('gakushu-tag'));
  expect(defined).toBe(true);

  const learner = page.locator('gakushu-tag[kind="blue"]').first();
  await expect(learner).toHaveText('学習者用');
  const bg = await learner.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(219, 234, 254)'); // #dbeafe
});

test('blockly-lab: 定義済みで、内部構造がconnectedCallback()により動的に構築される', async ({ page }) => {
  await page.goto('gakushucho.html#1-1');
  const defined = await page.evaluate(() => !!customElements.get('blockly-lab'));
  expect(defined).toBe(true);

  const lab = page.locator('#page-1-1 blockly-lab').first();
  await expect(lab).toBeVisible();
  // 生成直後の子要素（実行ボタン等）が実際に存在すること。
  await expect(lab.locator('.btn-run')).toBeVisible();
  await expect(lab.locator('.btn-step')).toBeVisible();
  await expect(lab.locator('.blockly-workspace-div')).toBeAttached();
});

test('portal_cards: gakushucho.md側のCARD定義がindex.htmlの巻末付録カードに反映される', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('index.html');

  const setupCard = page.locator('a.card[href="gakushucho_teach.html#setup"]');
  await expect(setupCard.locator('.card-title')).toHaveText('📦 オフライン設置・端末別セットアップガイド');
  await expect(setupCard.locator('gakushu-tag')).toHaveText('巻末付録①');

  // {{CH}}/{{SEC}}プレースホルダが実際の章・節数（8章24節）に置換されていること。
  const lessonPlanCard = page.locator('a.card[href="gakushucho_teach.html#lesson_plan"]');
  await expect(lessonPlanCard.locator('.card-title')).toHaveText('📋 全8章 授業詳細指導案・評価規準一覧');
  await expect(lessonPlanCard.locator('.card-desc')).toContainText('全8章24節');
  expect(errors).toEqual([]);
});

