// @ts-check
const path = require('path');
const { defineConfig } = require('@playwright/test');

// このconfig自体がtests/配下にあるため、プロジェクトルートは一つ上。
const rootDir = path.join(__dirname, '..');

module.exports = defineConfig({
  testDir: '.',
  // build-logic.spec.js / dead-links.spec.js は node:test 用（ブラウザ不要）。
  // `node --test tests/*.spec.js` 側で実行し、Playwright側では対象から除外する。
  testIgnore: ['**/build-logic.spec.js', '**/dead-links.spec.js'],
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: 'file://' + rootDir + '/',
  },
});
