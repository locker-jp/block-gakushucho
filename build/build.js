// 『ブロック学習帳』 単一統合SPAコンパイラ (一括ビルドスクリプト)
// 設置場所: build/build.js & build/build_all.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rootDir = path.resolve(__dirname, '..');
const develDir = path.join(rootDir, 'build', 'devel');
if (!fs.existsSync(develDir)) {
  fs.mkdirSync(develDir, { recursive: true });
}
const buildDir = path.join(rootDir, 'build');
const develOutputDir = path.join(rootDir, 'devel');
const masterMdPath = path.join(buildDir, 'gakushucho.md');

[buildDir, develOutputDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// 共通 CSS スタイル
const commonCss = `
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #eff6ff;
  --text-color: #1e293b;
  --text-light: #64748b;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --border-color: #e2e8f0;
  --success-color: #16a34a;
  --header-bg: #1e293b;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.top-bar {
  background-color: var(--header-bg);
  color: #ffffff;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: static;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.top-bar .title { font-size: 1.1rem; font-weight: 800; color: #ffffff; }
.top-bar a {
  color: #93c5fd;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.top-bar a:hover { background: rgba(255,255,255,0.35); }
.top-bar-data-btn {
  color: #93c5fd;
  background: transparent;
  border: 1px solid rgba(147,197,253,0.5);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 6px;
  transition: background 0.2s;
}
.top-bar-data-btn:hover { background: rgba(255,255,255,0.35); }

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.card .tag {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 12px;
}
.card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: var(--primary-color); }
.card-desc { font-size: 0.875rem; color: var(--text-light); }

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn:hover { background-color: var(--primary-hover); }
.btn-secondary { background-color: #475569; }
.btn-secondary:hover { background-color: #334155; }

.section-page { display: none; }
.section-page.active { display: block; animation: fadeIn 0.3s ease-in-out; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* <table is="gakushu-table" class="gakushu-table"> : customized built-in element。
   HTML5パーサーは tr/th/td を実際の <table> の中でないと静かに破棄するため、タグ自体は
   <table> のまま維持し、Web Componentsの拡張機構(customized built-in)で共通化する。 */
.gakushu-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
}
.gakushu-table > tr:first-child { background: #f1f5f9; font-weight: bold; }
.gakushu-table > tr > th,
.gakushu-table > tr > td {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

/* <gakushu-note kind="success|announcement|highlight|neutral"> : Web Component。色付き注記枠の共通化。 */
gakushu-note {
  display: block;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 20px 0;
}
gakushu-note[kind="success"] {
  background: #f0fdf4;
  border-left: 4px solid #16a34a;
  border-radius: 0 8px 8px 0;
}
gakushu-note[kind="success"] h2,
gakushu-note[kind="success"] h3 {
  color: #15803d;
  margin-top: 0;
  font-size: 1.05rem;
}
gakushu-note[kind="announcement"] {
  background: #fffbebf8;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;
}
gakushu-note[kind="highlight"] {
  background: #ffffff;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin: 24px 0;
}
gakushu-note[kind="neutral"] {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 16px;
  margin: 0;
}
/* <details class="choice-hint-details"> : ネイティブの開閉挙動を保つため要素はdetailsのまま、
   色は gakushu-note[kind="success"] と同一パレットをクラスとして共有する。 */
.choice-hint-details {
  margin: 12px 0;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-left: 4px solid #16a34a;
  border-radius: 8px;
  padding: 10px 14px;
}

/* <gakushu-tag kind="gray|blue|green|amber|indigo"> : Web Component。ポータルカード等のバッジ共通化。 */
gakushu-tag {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 12px;
}
gakushu-tag[kind="gray"] { background: #e2e8f0; color: #334155; }
gakushu-tag[kind="blue"] { background: #dbeafe; color: #1e40af; }
gakushu-tag[kind="green"] { background: #dcfce7; color: #166534; }
gakushu-tag[kind="amber"] { background: #fef3c7; color: #92400e; }
gakushu-tag[kind="indigo"] { background: #e0e7ff; color: #3730a3; }
`;

// .teacher-guide-annotation の色・枠の見た目は gakushu-note[kind="success"]（commonCss側）に統合済み。
// このクラス自体は .mode-learn/.mode-teach の表示切り替えCSSが参照する「マーカー」としてのみ残す。
const guideAnnotationCss = '';

// 共有 Web Components (Custom Elements) 定義。commonCss と同様、<style>${commonCss}</style> が
// 出現する全出力（gakushucho.html / index.html / devel/*.html）に <script>${commonComponentsScript}</script>
// として併記する。Light DOM（Shadow DOMなし）なので commonCss/guideAnnotationCss がそのままカスケードする。
const commonComponentsScript = `
try {
  // customized built-in element（<table is="gakushu-table">）。Safariは is= 拡張に未対応だが、
  // 見た目はCSSクラス(.gakushu-table)側で担保しているため、未対応環境でも表は正しく表示される。
  customElements.define('gakushu-table', class extends HTMLTableElement {}, { extends: 'table' });
} catch (e) { /* is= 拡張未対応ブラウザ: CSSクラスによる見た目は引き続き有効 */ }
customElements.define('gakushu-note', class extends HTMLElement {});
customElements.define('gakushu-tag', class extends HTMLElement {});
`;

function parseMasterMd() {
  const content = fs.readFileSync(masterMdPath, 'utf-8');
  const sections = {};
  const regex = /<!-- SECTION_START: (\w+) -->([\s\S]*?)<!-- SECTION_END: \1 -->/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    sections[match[1]] = match[2].trim();
  }
  return sections;
}

function mdToHtml(mdText, chNum, explicitSecNum, isGuide = false, relPrefix = '') {
  let secCount = explicitSecNum ? explicitSecNum - 1 : 0;
  let cleanMd = mdText;

  if (!isGuide) {
    cleanMd = cleanMd.replace(/<!-- teacher-guide-start -->[\s\S]*?<!-- teacher-guide-end -->/g, '');
  }

  // 生HTML内の worksheets/ パスを動的補正
  cleanMd = cleanMd.replace(/(href|src)=["'](?:\.\.\/)?worksheets\/([^"']+)["']/gi, (m, attr, file) => {
    return `${attr}="${relPrefix}worksheets/${file}"`;
  });

  cleanMd = cleanMd.replace(/^>\s*\[!NOTE\]\s*/gim, '');
  cleanMd = cleanMd.split('\n').map(line => {
    if (line.startsWith('> ')) return line.substring(2);
    if (line.startsWith('>')) return line.substring(1);
    return line;
  }).join('\n');

  // 💡 選択肢のヒント・選択肢支援の自動トグルボックス化 (最初非表示、タップ/クリックで表示)
  cleanMd = cleanMd.replace(/\*(?:（|\()選択肢支援[：:]\s*([^\n\)]+)(?:）|\))\*/g, (m, hintText) => {
    return `<details class="choice-hint-details">
      <summary style="cursor:pointer;font-weight:bold;color:#166534;user-select:none;outline:none;">💡 考え方・回答の選択肢ヒントを見る ▼</summary>
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #a7f3d0;font-size:0.9rem;color:#1e293b;">
        <strong>【選択肢ヒント】：</strong> ${hintText}
      </div>
    </details>`;
  });

  if (isGuide) {
    cleanMd = cleanMd.replace(/<!-- teacher-guide-start -->/g, '<gakushu-note kind="success" class="teacher-guide-annotation">');
    cleanMd = cleanMd.replace(/<!-- teacher-guide-end -->/g, '</gakushu-note>');
  }

  // <blockly-lab> Web Component（customized要素ではなく通常のCustom Element）。
  // 以前はここで約40行のHTMLを毎回展開していたが、内部構造は BlocklyLab.connectedCallback() に
  // 移動し、mdToHtml側は短いプレースホルダタグを出力するだけにする（gakushucho.html全体の
  // サイズ削減の主因）。class="blockly-embed-container" は既存のCSS/テストが引き続き機能するよう
  // 要素自身に付与する。
  cleanMd = cleanMd.replace(/<div class="blockly-embed" data-preset="([^"]+)" data-title="([^"]+)"><\/div>/g, (m, preset, title) => {
    const formattedTitle = title.replace(/体験コーナー/g, '実習：つないでみよう！');
    return `<blockly-lab class="blockly-embed-container" data-preset="${preset}" data-title="${formattedTitle}"></blockly-lab>`;
  });

  const lines = cleanMd.split('\n');
  let html = '';
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('<gakushu-note kind="success" class="teacher-guide-annotation">')) {
      if (inTable) { html += '</table>\n'; inTable = false; }
      html += '<gakushu-note kind="success" class="teacher-guide-annotation">\n';
      continue;
    }
    if (line.startsWith('</gakushu-note>')) {
      html += '</gakushu-note>\n';
      continue;
    }
    if (line.startsWith('</div>')) {
      if (inTable) { html += '</table>\n'; inTable = false; }
      html += '</div>\n';
      continue;
    }

    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        html += '<table is="gakushu-table" class="gakushu-table" role="table">\n';
      }
      if (line.includes('---')) {
        tableHeaderDone = true;
        continue;
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!tableHeaderDone) {
        html += '  <tr>\n';
        cells.forEach(c => { html += `    <th>${inlineFormatting(c, relPrefix)}</th>\n`; });
        html += '  </tr>\n';
      } else {
        html += '  <tr>\n';
        cells.forEach(c => { html += `    <td>${inlineFormatting(c, relPrefix)}</td>\n`; });
        html += '  </tr>\n';
      }
      continue;
    } else {
      if (inTable) {
        html += '</table>\n';
        inTable = false;
      }
    }

    if (line.startsWith('# ')) {
      html += `<h1>${inlineFormatting(line.substring(2))}</h1>\n`;
    } else if (line.startsWith('## ')) {
      secCount++;
      const secTitle = line.substring(3);
      html += `<h2>${inlineFormatting(secTitle, relPrefix)}</h2>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h3>${inlineFormatting(line.substring(4), relPrefix)}</h3>\n`;
    } else if (line.startsWith('#### ')) {
      html += `<h4>${inlineFormatting(line.substring(5), relPrefix)}</h4>\n`;
    } else if (line.trim().startsWith('- ')) {
      const indent = line.search(/\S/);
      const text = line.trim().substring(2);
      const marginStyle = indent >= 2 ? 'margin-left: 24px; list-style-type: circle;' : 'margin-top: 8px; font-weight: bold;';
      html += `<li style="${marginStyle}">${inlineFormatting(text, relPrefix)}</li>\n`;
    } else if (/^\d+\.\s+/.test(line.trim())) {
      html += `<li>${inlineFormatting(line.trim().replace(/^\d+\.\s+/, ''), relPrefix)}</li>\n`;
    } else if (line.trim() === '---') {
      html += '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">\n';
    } else if (line.trim() !== '') {
      if (!line.startsWith('<div') && !line.startsWith('</div') && !line.startsWith('<blockly-lab')) {
        html += `<p>${inlineFormatting(line, relPrefix)}</p>\n`;
      } else {
        html += line + '\n';
      }
    }
  }
  if (inTable) { html += '</table>\n'; }

  return html;
}

function inlineFormatting(text, relPrefix = '') {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
      let cleanUrl = url;
      if (cleanUrl.includes('worksheets/')) {
        const file = cleanUrl.substring(cleanUrl.indexOf('worksheets/') + 11);
        cleanUrl = `${relPrefix}worksheets/${file}`;
      }
      return `<a href="${cleanUrl}" style="color:#2563eb;text-decoration:underline;" target="_blank">${label}</a>`;
    });
}

function generateDevelHTML() {
  // 開発用ファイル (build/devel/ 内の .md) -> devel/ フォルダへ出力 (非公開、配布パッケージには含めない)
  const devDocsDir = path.join(buildDir, 'devel');
  if (fs.existsSync(devDocsDir)) {
    const devFiles = fs.readdirSync(devDocsDir).filter(f => f.endsWith('.md'));
    if (devFiles.length === 0) {
      console.log('  Skipped: build/devel/ に .md ソースが無いため devel/*.html の生成をスキップしました');
      return;
    }
    const devDocsList = [];
    devFiles.forEach(file => {
      const filePath = path.join(devDocsDir, file);
      const mdContent = fs.readFileSync(filePath, 'utf-8');
      const firstLine = mdContent.split('\n')[0];
      let title = file;
      if (firstLine.startsWith('# ')) {
        title = firstLine.substring(2).trim();
      }
      const htmlName = file.replace('.md', '.html');
      devDocsList.push({ file, htmlName, title, mdContent });

      const bodyHtml = mdToHtml(mdContent, null, null, true);
      const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${commonCss}${guideAnnotationCss}</style>
  <script>${commonComponentsScript}</script>
</head>
<body>
  <div class="top-bar" style="background:#475569;">
    <div class="title">🛠️ 開発・管理資料: ${title}</div>
    <div><a href="index.html">📋 develポータル</a></div>
  </div>
  <div class="container" style="margin-top:24px;">
    ${bodyHtml}
  </div>
</body>
</html>`;
      fs.writeFileSync(path.join(develOutputDir, htmlName), fullHtml, 'utf-8');
      console.log('  Generated Dev Doc HTML: ' + path.relative(rootDir, path.join(develOutputDir, htmlName)));
    });

    const generatedCards = devDocsList.map(item => `
      <a class="card" href="${item.htmlName}">
        <gakushu-tag kind="gray">DEV DOC</gakushu-tag>
        <div class="card-title">${item.title}</div>
        <div class="card-desc">ファイル名: ${item.htmlName}</div>
      </a>
    `).join('\n');

    const develIndexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛠️ 開発・管理資料ポータル (devel)</title>
  <style>${commonCss}</style>
  <script>${commonComponentsScript}</script>
</head>
<body>
  <div class="top-bar" style="background:#475569;">
    <div class="title">🛠️ 開発・管理資料ポータル (非公開)</div>
    <div><a href="../index.html">🏠 トップポータル</a></div>
  </div>
  <div class="container">
    <h1>開発・管理ドキュメント集 (devel)</h1>
    <p>プロジェクト開発方針・理念要約（ref01）、バージョンアップ運用モデル、およびバージョン変更履歴（changelog）の内部開発者・管理者向けドキュメント集です。</p>

    <div class="card-grid" style="margin-top:24px;">
      ${generatedCards}
    </div>
  </div>
</body>
</html>`;
    fs.writeFileSync(path.join(develOutputDir, 'index.html'), develIndexHtml, 'utf-8');
    console.log('  Generated Dev Docs Portal: ' + path.relative(rootDir, path.join(develOutputDir, 'index.html')));
  }
}

function getSortedChapterKeys(sections) {
  return Object.keys(sections)
    .filter(k => /^ch0*\d+$/i.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/^ch0*/i, ''), 10);
      const numB = parseInt(b.replace(/^ch0*/i, ''), 10);
      return numA - numB;
    });
}

// 章本文を「章概要（## より前の導入文、secIdx=0）」と「## 区切りの各節（secIdx=1,2,...）」に分割する。
// buildLessonPlanHtml・generateSingleGakushuchoHtmlのページ生成ループ・contentStats集計が共通で使う唯一の分割ロジック。
function splitChapterSections(rawText) {
  const parts = rawText.split(/(?=^## )/m);
  const result = [];
  let secIdx = 0;
  parts.forEach((part, index) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const isChapterIntro = (index === 0 && !trimmed.startsWith('## '));
    if (!isChapterIntro) secIdx++;
    result.push({ secIdx: isChapterIntro ? 0 : secIdx, part, isChapterIntro });
  });
  return result;
}

// "## N-M. 見出し" 形式の1行目から、番号プレフィックスを除いた見出し文字列を取り出す（無ければnull）。
function cleanSectionHeading(firstLine) {
  const titleMatch = firstLine.match(/^## (.*$)/);
  if (!titleMatch) return null;
  return titleMatch[1].replace(/^[0-9]+-[0-9]+\.\s*/, '').trim();
}

// セクション本文の先頭行にある "# 見出し" をナビ表示名として抽出する。
// 章ページ側（buildLessonPlanHtml等）が既に採用している「実見出しから導出する」
// 方式と同じで、非章セクション用にも横展開したもの。以前は titlesMap という
// build.js側の別データで手書きしており、gakushucho.md側の実見出しと乖離していた
// （2026-08-16、6件中5件が不一致と判明・修正）。
function extractH1Title(rawText, fallback) {
  const firstLine = rawText.trim().split('\n')[0];
  const m = firstLine.match(/^# (.*)$/);
  return m ? m[1].trim() : fallback;
}

// 章キー(sections)から、全章の節数集計・総節数などを1回だけ計算する単一の情報源。
// build.js内の「全8章26節」のような文言はすべてここから展開する。
function computeContentStats(sections) {
  const chapterKeys = getSortedChapterKeys(sections);
  const sectionsByChapter = {};
  let totalSections = 0;
  chapterKeys.forEach(k => {
    const rawText = sections[k];
    if (!rawText) return;
    const count = splitChapterSections(rawText).filter(s => !s.isChapterIntro).length;
    sectionsByChapter[k] = count;
    totalSections += count;
  });
  return { chapterCount: chapterKeys.length, sectionsByChapter, totalSections };
}

// gakushucho.md の portal_cards セクション（ページとしては生成されない、ポータルカードの
// ラベル・説明文の置き場）から <!-- CARD: key | tagKind | title | desc --> 形式の行を読み取り、
// key をキーとしたオブジェクトにする。以前は index.html 生成側（build.js）に直書きされていた。
function parsePortalCards(sections) {
  const raw = sections['portal_cards'] || '';
  const cards = {};
  const re = /<!--\s*CARD:\s*([a-zA-Z_]+)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*-->/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    cards[m[1]] = { tagKind: m[2], title: m[3], desc: m[4] };
  }
  return cards;
}

// portal_cards内の {{CH}}(章数) / {{SEC}}(総節数) プレースホルダを実際の値に置換する
function fillCardPlaceholders(text, contentStats) {
  return text
    .replace(/\{\{CH\}\}/g, contentStats.chapterCount)
    .replace(/\{\{SEC\}\}/g, contentStats.totalSections);
}

function buildLessonPlanHtml(sections, relPrefix = '') {
  const orderKeys = getSortedChapterKeys(sections);
  let lessonPlanHtml = '';
  orderKeys.forEach(k => {
    if (!sections[k]) return;
    const rawText = sections[k];
    const chMatch = k.match(/^ch0*(\d+)$/i);
    if (!chMatch) return;
    const chNum = parseInt(chMatch[1], 10);

    splitChapterSections(rawText).forEach(({ secIdx, part, isChapterIntro }) => {
      if (isChapterIntro) return;
      const firstLine = part.trim().split('\n')[0];
      const cleanTitle = cleanSectionHeading(firstLine);
      const secTitle = cleanTitle ? `${chNum}-${secIdx}. ${cleanTitle}` : `第${chNum}章 第${secIdx}節`;

      const annotations = [];
      const regex = /<!-- teacher-guide-start -->([\s\S]*?)<!-- teacher-guide-end -->/g;
      let m;
      while ((m = regex.exec(part)) !== null) {
        annotations.push(m[1].trim());
      }

      if (annotations.length > 0) {
        lessonPlanHtml += `<h2 style="color:#15803d;border-bottom:2px solid #bbf7d0;padding-bottom:6px;margin-top:32px;">${secTitle}</h2>\n`;
        annotations.forEach(ann => {
          const parsed = mdToHtml(ann, chNum, secIdx, true, relPrefix);
          lessonPlanHtml += `<gakushu-note kind="success" class="teacher-guide-annotation" style="margin-bottom:20px;">\n${parsed}\n</gakushu-note>\n`;
        });
      }
    });
  });
  return lessonPlanHtml;
}

function generateSingleGakushuchoHtml(sections, targetDir, isGuide, mainTitle) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const relPrefix = (path.resolve(targetDir) === path.resolve(rootDir)) ? '' : '../';

  const pagesList = [];
  const pagesHtml = [];

  // 全セクション（指導者用含む）を全内包 (目次・学習帳本体・学習カード付録を先頭に、指導者ハンドブック類は巻末付録に配置)
  const chapterKeys = getSortedChapterKeys(sections);
  const orderKeys = ['toc', ...chapterKeys, 'appendix', 'setup', 'overview', 'news', 'teacher_appendix'];

  orderKeys.forEach(k => {
    if (!sections[k]) return;
    const rawText = sections[k];

    if (k === 'setup' || k === 'overview' || k === 'news' || k === 'toc' || k === 'appendix' || k === 'teacher_appendix') {
      const pageId = k;
      const title = extractH1Title(rawText, k);
      const isTeacherOnly = (k === 'setup' || k === 'overview' || k === 'news' || k === 'teacher_appendix');
      pagesList.push({ id: pageId, title: title, teacherOnly: isTeacherOnly });
      const convertedHtml = mdToHtml(rawText, null, null, true, relPrefix);
      pagesHtml.push(`
    <div id="page-${pageId}" class="section-page ${isTeacherOnly ? 'teacher-only-page' : ''}" data-page-id="${pageId}" data-page-title="${title}">
      ${convertedHtml}
    </div>`);
    } else {
      const chMatch = k.match(/^ch0?(\d+)$/);
      if (!chMatch) return;
      const chNum = parseInt(chMatch[1], 10);

      splitChapterSections(rawText).forEach(({ secIdx, part, isChapterIntro }) => {
        if (isChapterIntro) {
          const pageId = `${chNum}-0`;
          let pageTitle = `第${chNum}章 概要・学習目標`;
          const firstLine = part.trim().split('\n')[0];
          const h1Match = firstLine.match(/^# (.*$)/);
          if (h1Match) {
            const cleanH1 = h1Match[1].replace(/^第\d+章[：:\s]*/, '').trim();
            pageTitle = `第${chNum}章：${cleanH1}`;
          }

          pagesList.push({ id: pageId, title: pageTitle, teacherOnly: false });
          const convertedHtml = mdToHtml(part, chNum, 0, true, relPrefix);
          pagesHtml.push(`
    <div id="page-${pageId}" class="section-page" data-page-id="${pageId}" data-page-title="${pageTitle}">
      ${convertedHtml}
    </div>`);
        } else {
          const pageId = `${chNum}-${secIdx}`;
          const firstLine = part.trim().split('\n')[0];
          const cleanTitle = cleanSectionHeading(firstLine);
          const pageTitle = cleanTitle ? `${chNum}-${secIdx}. ${cleanTitle}` : `${chNum}-${secIdx}`;

          pagesList.push({ id: pageId, title: pageTitle, teacherOnly: false });
          const convertedHtml = mdToHtml(part, chNum, secIdx, true, relPrefix);
          pagesHtml.push(`
    <div id="page-${pageId}" class="section-page" data-page-id="${pageId}" data-page-title="${pageTitle}">
      ${convertedHtml}
    </div>`);
        }
      });
    }
  });

  // 全8章詳細指導案 (lesson_plan) も内包セクションとして生成
  const extractedLessonPlanHtml = buildLessonPlanHtml(sections, relPrefix);
  pagesList.push({ id: 'lesson_plan', title: `📋 全${contentStats.chapterCount}章 授業詳細指導案一覧`, teacherOnly: true });
  pagesHtml.push(`
    <div id="page-lesson_plan" class="section-page teacher-only-page" data-page-id="lesson_plan" data-page-title="📋 全${contentStats.chapterCount}章 授業詳細指導案一覧">
      <gakushu-note kind="success" style="margin-bottom:24px;">
        <h2 style="margin-top:0;color:#166534;">📋 教員・指導者用 詳細指導案一覧</h2>
        <p style="margin:0;font-size:0.9rem;color:#15803d;">全${contentStats.chapterCount}章${contentStats.totalSections}節の授業フロー、口頭メッセージ、観点別評価規準を網羅した指導用参考資料です。</p>
      </gakushu-note>
      ${extractedLessonPlanHtml}
    </div>`);

  const fullSpaHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mainTitle}</title>
  <!-- 指導者モード動的探知 ＆ URLクエリ手動上書き判定スクリプト -->
  <script>
    window.OVERRIDE_TEACH = null;
    (function() {
      try {
        var p = new URLSearchParams(window.location.search);
        if (p.has('teach')) {
          window.OVERRIDE_TEACH = (p.get('teach') === '1');
        } else if (p.has('mode')) {
          window.OVERRIDE_TEACH = (p.get('mode') === 'teach');
        }
      } catch(e){}
    })();
    window.IS_TEACHER_ENVIRONMENT = false;
  </script>
  <!-- js/teach.js の存在探知 (生徒PC等で除外されていれば404/onerrorとなり無効化) -->
  <script src="${relPrefix}js/teach.js" onerror="window.IS_TEACHER_ENVIRONMENT=false;"></script>
  <script>
    window.IS_TEACHER_MODE = (window.OVERRIDE_TEACH !== null) ? window.OVERRIDE_TEACH : window.IS_TEACHER_ENVIRONMENT;
    if (window.IS_TEACHER_MODE) {
      document.documentElement.classList.add('mode-teach');
    } else {
      document.documentElement.classList.add('mode-learn');
    }
  </script>
  <!-- Blockly ライブラリ (授業時オフラインローカル優先 ＆ 自動フォールバック描画) -->
  <script src="${relPrefix}js/blockly_compressed.js"></script>
  <script src="${relPrefix}js/blocks_compressed.js"></script>
  <script src="${relPrefix}js/javascript_compressed.js"></script>
  <script src="${relPrefix}js/python_compressed.js"></script>
  <script src="${relPrefix}js/dncl_compressed.js"></script>
  <script src="${relPrefix}js/msg/ja.js"></script>
  <script>
    if (typeof Blockly === 'undefined' || typeof Blockly.inject !== 'function') {
      ['https://unpkg.com/blockly/blockly_compressed.js',
       'https://unpkg.com/blockly/blocks_compressed.js',
       'https://unpkg.com/blockly/javascript_compressed.js',
       'https://unpkg.com/blockly/msg/ja.js'
      ].forEach(function(src) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        document.head.appendChild(s);
      });
    }
  </script>
  <style>
    ${commonCss}
    ${guideAnnotationCss}
    /* モード別表示切り替えCSS */
    .section-page { display: none; }
    .section-page.active { display: block; }

    .mode-learn .teacher-guide-annotation,
    .mode-learn .teacher-only-page,
    .mode-learn .teacher-only-menu,
    .mode-learn .teacher-only-btn { display: none !important; }

    .mode-teach .teacher-guide-annotation { display: block; }
    .mode-teach .teacher-only-page { display: none; }
    .mode-teach .teacher-only-page.active { display: block; }
    .mode-teach .teacher-only-menu { display: block; }
    .mode-teach .teacher-only-btn { display: inline-flex !important; }
    .layout-wrapper { display: flex; min-height: auto; }
    .sidebar {
      width: 280px;
      background-color: #ffffff;
      border-right: 1px solid var(--border-color);
      padding: 16px;
      flex-shrink: 0;
      position: static;
    }
    .sidebar-title { font-weight: 700; font-size: 0.9rem; color: var(--text-light); margin-bottom: 12px; text-transform: uppercase; }
    .sidebar-menu { list-style: none; padding: 0; margin: 0; }
    .sidebar-menu li { margin-bottom: 4px; }
    .sidebar-menu a {
      display: block;
      padding: 8px 12px;
      color: var(--text-color);
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar-menu a:hover { background-color: var(--primary-light); color: var(--primary-color); }
    .sidebar-menu a.active { background-color: var(--primary-color); color: #ffffff; font-weight: 600; }
    .content-area { flex-grow: 1; padding: 32px 40px; max-width: 900px; }

    .mobile-menu-btn { display: none; }
    .mobile-select-wrapper { display: none; }

    /* Blockly 体験コーナー スタイル */
    .blockly-embed-container {
      margin: 24px 0;
      background: #1e293b;
      border: 2px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .blockly-embed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #38bdf8;
      padding: 10px 16px;
      font-weight: bold;
      border-bottom: 1px solid #334155;
      flex-wrap: wrap;
      gap: 8px;
    }
    .embed-controls { display: flex; gap: 8px; }
    .btn-run { background: #16a34a; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-run:hover { background: #15803d; }
    .btn-reset { background: #475569; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-reset:hover { background: #334155; }
    .btn-fullscreen { background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-fullscreen:hover { background: #1d4ed8; }

    .blockly-embed-body {
      display: flex;
      flex-direction: row;
      min-height: 440px;
    }
    .blockly-workspace-wrapper {
      flex: 1;
      min-height: 440px;
      position: relative;
      overflow: hidden;
      background-color: #0f172a;
    }
    .blockly-workspace-div {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 400px !important;
    }

    .blockly-stage-wrapper {
      width: 280px;
      background: #1e293b;
      border-left: 1px solid #334155;
      display: flex;
      flex-direction: column;
      padding: 12px;
      gap: 12px;
    }
    .stage-screen {
      flex: 1;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 8px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 140px;
    }
    .stage-avatar { font-size: 3.5rem; transition: transform 0.4s ease; position: absolute; }
    .stage-speech {
      position: absolute;
      top: 12px;
      background: #fff;
      color: #0f172a;
      padding: 6px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.3s;
      max-width: 80%;
      text-align: center;
      z-index: 10;
    }
    .stage-led {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #334155;
      border: 2px solid #475569;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .stage-led.on { background: #facc15; box-shadow: 0 0 12px #facc15; }
    .stage-screen-label {
      position: absolute;
      bottom: 8px;
      left: 8px;
      font-size: 0.75rem;
      color: #94a3b8;
      background: rgba(0,0,0,0.5);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .stage-logs {
      height: 100px;
      background: #000;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 8px;
      font-family: monospace;
      font-size: 0.8rem;
      color: #4ade80;
      overflow-y: auto;
    }
    .stage-logs p { margin: 0 0 2px 0; }

    /* 画面遷移(screen_switch)の視覚表現。ブロックの機能・生成コードは変更せず、
       ステージ上の見た目だけで「画面が切り替わった」ことを分かりやすくする。 */
    .stage-screen-banner {
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 6px 8px;
      font-size: 0.85rem;
      font-weight: bold;
      text-align: center;
      color: #fff;
      background: rgba(30,41,59,0.85);
      opacity: 0;
      transform: translateY(-100%);
      transition: opacity 0.25s, transform 0.25s;
      z-index: 5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stage-screen-banner.visible { opacity: 1; transform: translateY(0); }
    .stage-screen-banner.theme-quiz { background: rgba(37,99,235,0.9); }
    .stage-screen-banner.theme-result { background: rgba(202,138,4,0.9); }
    @keyframes stage-screen-flash { 0% { filter: brightness(2.2); } 100% { filter: brightness(1); } }
    .stage-screen.screen-flash { animation: stage-screen-flash 0.4s ease-out; }

    /* イベントボタン(event_button)の可視化。LED・光センサーと同様、実行中のみ表示する
       純粋な視覚インジケータ（クリックでは反応しない。押されたタイミングで一瞬光る）。 */
    .stage-button-row {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .stage-button-indicator {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #334155;
      border: 2px solid #475569;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .stage-button-indicator.pressed { background: #4ade80; box-shadow: 0 0 10px #4ade80; }

    /* 全画面表示（全画面モーダル）クラス */
    .blockly-embed-container.fullscreen-mode {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      margin: 0 !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .blockly-embed-container.fullscreen-mode .blockly-embed-body {
      flex: 1 !important;
      height: calc(100vh - 50px) !important;
    }

    /* スモールスクリーン (レスポンシブ) 対応 */
    @media (max-width: 768px) {
      .blockly-embed-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .embed-controls {
        width: 100%;
        align-items: stretch !important;
      }
      .controls-row-top, .controls-row-bottom {
        width: 100%;
        justify-content: flex-start;
      }
      .layout-wrapper { flex-direction: column; }
      .sidebar {
        width: 100%;
        max-height: none;
        position: static;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        padding: 12px 16px;
      }
      .mobile-select-wrapper {
        display: block;
        margin-bottom: 12px;
      }
      .mobile-select {
        width: 100%;
        padding: 10px 14px;
        font-size: 0.95rem;
        font-weight: 600;
        border-radius: 8px;
        border: 2px solid var(--primary-color);
        background-color: #ffffff;
        color: var(--text-color);
      }
      .mobile-menu-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        background: var(--primary-light);
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        padding: 8px 14px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        margin-bottom: 8px;
      }
      .sidebar-menu-container { display: none; }
      .sidebar-menu-container.open { display: block; margin-top: 8px; }
      .content-area { padding: 20px 16px; }

      /* スモールスクリーン用：1. シミュレータステージ・一般コンソール・コード変換領域（上部） → 2. ワークスペース（下部） */
      .blockly-embed-body { flex-direction: column !important; min-height: auto !important; }
      .blockly-stage-wrapper {
        order: 1 !important; /* シミュレータ・ログ・コード変換領域を最上部（実行ボタン直下）に配置 */
        width: 100% !important;
        border-left: none !important;
        border-bottom: 2px solid #334155 !important;
      }
      .blockly-workspace-wrapper {
        order: 2 !important; /* ワークスペースを下に配置 */
        width: 100% !important;
        height: 360px !important;
      }
    }
  </style>
  <script>${commonComponentsScript}</script>
</head>
<body>
  <div class="top-bar">
    <div class="title">${mainTitle}</div>
    <div>
      <button id="btnAllDataExport" class="top-bar-data-btn" title="全ての実習の自動保存データ(このブラウザに残っているもの)を1つのファイルにまとめて保存">💾 全件保存</button>
      <button id="btnAllDataImport" class="top-bar-data-btn" title="全件保存ファイルから、この端末に全実習分をまとめて読み込む">📂 全件読込</button>
      <input type="file" id="inputAllDataImport" accept=".json" style="display:none;">
      <a href="index.html">📋 ポータル</a>
    </div>
  </div>

  <div class="layout-wrapper">
    <aside class="sidebar">
      <!-- スマホ・スモール画面用 プルダウンセレクトナビ -->
      <div class="mobile-select-wrapper">
        <select class="mobile-select" id="mobileSelectNav" aria-label="章節移動"></select>
      </div>

      <!-- スマホ・スモール画面用 折りたたみトグルボタン -->
      <button class="mobile-menu-btn" id="mobileToggleBtn">
        <span>📋 章節一覧（折りたたみ目次）</span>
        <span id="toggleIcon">▼ 開く</span>
      </button>

      <div class="sidebar-menu-container" id="sidebarContainer">
        <div class="sidebar-title">目次・章節ナビ</div>
        <ul class="sidebar-menu" id="sidebarMenu"></ul>
      </div>
    </aside>

    <main class="content-area">
      ${pagesHtml.join('\n')}

      <div class="nav-buttons">
        <button id="prevBtn" class="btn btn-secondary">← 前の節へ</button>
        <span id="pageIndicator" style="font-size:0.9rem;color:var(--text-light);font-weight:600;"></span>
        <button id="nextBtn" class="btn">次の節へ →</button>
      </div>
    </main>
  </div>

  <script>
    const allPages = ${JSON.stringify(pagesList)};
    let activePages = [];
    let currentIndex = 0;

    function getActivePages() {
      return allPages.filter(p => window.IS_TEACHER_MODE || !p.teacherOnly);
    }

    function renderNavs() {
      activePages = getActivePages();
      // 1. デスクトップ用サイドバーメニュー
      const menu = document.getElementById('sidebarMenu');
      menu.innerHTML = '';
      activePages.forEach((p, idx) => {
        const li = document.createElement('li');
        if (p.teacherOnly) li.classList.add('teacher-only-menu');
        const a = document.createElement('a');
        a.href = '#' + p.id;
        a.textContent = p.title;
        if (idx === currentIndex) a.classList.add('active');
        a.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo(idx);
          closeMobileMenu();
        });
        li.appendChild(a);
        menu.appendChild(li);
      });

      // 2. モバイル用プルダウンメニュー
      const select = document.getElementById('mobileSelectNav');
      select.innerHTML = '';
      activePages.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.title;
        if (idx === currentIndex) opt.selected = true;
        select.appendChild(opt);
      });
    }

    function getPyGen() {
      if (typeof Blockly !== 'undefined' && Blockly.Python) return Blockly.Python;
      if (typeof python !== 'undefined' && python.pythonGenerator) return python.pythonGenerator;
      return null;
    }
    function getJsGen() {
      if (typeof Blockly !== 'undefined' && Blockly.JavaScript) return Blockly.JavaScript;
      if (typeof javascript !== 'undefined' && javascript.javascriptGenerator) return javascript.javascriptGenerator;
      return null;
    }

    // -------------------------------------------------------------
    // 💡 ブロック学習帳 独自カスタムブロック群 (旧版より復元)
    // -------------------------------------------------------------
    if (typeof Blockly !== 'undefined' && Blockly.defineBlocksWithJsonArray) {
      try {
        Blockly.defineBlocksWithJsonArray(${JSON.stringify(CUSTOM_BLOCKS)});
      } catch(e) {}

      const pyG = getPyGen();
      if (pyG) {
        const pyAtomic = pyG.ORDER_ATOMIC || 0;
        const pyFuncs = {
          'sound_play': function() { return 'play_sound()' + String.fromCharCode(10); },
          'say_text': function(b) { return 'print(' + JSON.stringify(b.getFieldValue('TEXT')) + ')' + String.fromCharCode(10); },
          'move_steps': function(b) { return 'move(' + b.getFieldValue('STEPS') + ')' + String.fromCharCode(10); },
          'play_meow': function() { return 'play_meow()' + String.fromCharCode(10); },
          'turn_right': function(b) { return 'turn_right(' + b.getFieldValue('DEGREES') + ')' + String.fromCharCode(10); },
          'sensor_light': function() { return ['get_sensor_light()', pyAtomic]; },
          'led_on': function() { return 'led.on()' + String.fromCharCode(10); },
          'led_off': function() { return 'led.off()' + String.fromCharCode(10); },
          'event_button': function() { return '# ボタンが押されたとき:' + String.fromCharCode(10); },
          'screen_switch': function(b) { return 'switch_screen(' + JSON.stringify(b.getFieldValue('SCREEN')) + ')' + String.fromCharCode(10); },
          'var_score_get': function() { return ['score', pyAtomic]; },
          'var_score_change': function(b) { return 'score += ' + b.getFieldValue('DELTA') + String.fromCharCode(10); },
          'var_score_set': function(b) { return 'score = ' + b.getFieldValue('VAL') + String.fromCharCode(10); },
          'show_score': function() { return 'print("スコア:", score)' + String.fromCharCode(10); },
          'algo_linear_search': function(b) {
            return ['linear_search(' + (pyG.valueToCode(b, 'LIST', pyAtomic) || '[]') + ', ' + (pyG.valueToCode(b, 'TARGET', pyAtomic) || 'None') + ')', pyAtomic];
          },
          'algo_binary_search': function(b) {
            return ['binary_search(' + (pyG.valueToCode(b, 'LIST', pyAtomic) || '[]') + ', ' + (pyG.valueToCode(b, 'TARGET', pyAtomic) || 'None') + ')', pyAtomic];
          },
          'algo_bubble_sort': function(b) {
            return ['bubble_sort(' + (pyG.valueToCode(b, 'LIST', pyAtomic) || '[]') + ')', pyAtomic];
          }
        };
        for (let k in pyFuncs) {
          pyG[k] = pyFuncs[k];
          if (pyG.forBlock) pyG.forBlock[k] = pyFuncs[k];
        }
      }

      const jsG = getJsGen();
      if (jsG) {
        const jsAtomic = jsG.ORDER_ATOMIC || 0;
        const jsFuncs = {
          'sound_play': function() { return 'playChime();' + String.fromCharCode(10); },
          'say_text': function(b) { return 'sayText(' + JSON.stringify(b.getFieldValue('TEXT')) + ');' + String.fromCharCode(10); },
          'move_steps': function(b) { return 'moveAvatar(' + b.getFieldValue('STEPS') + ');' + String.fromCharCode(10); },
          'play_meow': function() { return 'playMeow();' + String.fromCharCode(10); },
          'turn_right': function(b) { return 'turnAvatar(' + b.getFieldValue('DEGREES') + ');' + String.fromCharCode(10); },
          'sensor_light': function() { return ['30', jsAtomic]; },
          'led_on': function() { return 'toggleLed(true);' + String.fromCharCode(10); },
          'led_off': function() { return 'toggleLed(false);' + String.fromCharCode(10); },
          'event_button': function() { return ''; },
          'screen_switch': function(b) { return 'switchScreen(' + JSON.stringify(b.getFieldValue('SCREEN')) + ');' + String.fromCharCode(10); },
          'var_score_get': function() { return ['score', jsAtomic]; },
          'var_score_change': function(b) { return 'score += ' + b.getFieldValue('DELTA') + ';' + String.fromCharCode(10); },
          'var_score_set': function(b) { return 'score = ' + b.getFieldValue('VAL') + ';' + String.fromCharCode(10); },
          'show_score': function() { return 'showScore();' + String.fromCharCode(10); },
          'algo_linear_search': function(b) {
            return ['linearSearch(' + (jsG.valueToCode(b, 'LIST', jsAtomic) || '[]') + ', ' + (jsG.valueToCode(b, 'TARGET', jsAtomic) || 'null') + ')', jsAtomic];
          },
          'algo_binary_search': function(b) {
            return ['binarySearch(' + (jsG.valueToCode(b, 'LIST', jsAtomic) || '[]') + ', ' + (jsG.valueToCode(b, 'TARGET', jsAtomic) || 'null') + ')', jsAtomic];
          },
          'algo_bubble_sort': function(b) {
            return ['bubbleSort(' + (jsG.valueToCode(b, 'LIST', jsAtomic) || '[]') + ')', jsAtomic];
          }
        };
        for (let k in jsFuncs) {
          jsG[k] = jsFuncs[k];
          if (jsG.forBlock) jsG.forBlock[k] = jsFuncs[k];
        }
      }
    }

    const PRESETS = ${JSON.stringify(PRESETS)};

    // ========================================================================
    // <blockly-lab> Web Component
    // Blockly実習1つぶんのUI・実行エンジンをひとまとめにしたCustom Element。
    // 以前は16個の自由関数がコンテナDOM要素へのexpandoプロパティ(_ctx等)で
    // 状態管理していたが、インスタンスフィールド(this.ctx等)に統一した。
    // 内部の実行エンジン部分（evaluateValue/collectSteps等）は、controls_if の
    // DO0/ELSE や controls_repeat_ext の DO、procedures_defnoreturn の STACK など
    // 「入れ子になったブロック」を再帰的に実行し、値ブロック(条件式・リスト・
    // 四則演算等)も実際に評価する（従来 getNextBlock() チェーンしか辿らず
    // 入れ子を無視していた不具合の修正版）。
    // ========================================================================
    class BlocklyLab extends HTMLElement {
      connectedCallback() {
        if (this._built) return;
        this._built = true;

        const title = (this.dataset.title || '').replace(/体験コーナー/g, '実習：つないでみよう！');
        this.innerHTML =
          '      <div class="blockly-embed-header">\\n' +
          '        <span class="blockly-embed-title">🧩 ' + title + '</span>\\n' +
          '        <div class="embed-controls" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">\\n' +
          '          <div class="controls-row-top" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">\\n' +
          '            <button class="btn-run">▶ 実行</button>\\n' +
          '            <button class="btn-step" style="background:#ea580c;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="1命令ずつステップ実行（デバッグ学習）">⏯️ コマ送り</button>\\n' +
          '            <button class="btn-reset" title="現在のブロックを消して、教材の初期配置に戻します">🔄 初期配置に戻す</button>\\n' +
          '          </div>\\n' +
          '          <div class="controls-row-bottom" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">\\n' +
          '            <button class="btn-ud" style="background:#475569;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="キーボード・タップ選択操作の切り替え">♿ UD操作: OFF</button>\\n' +
          '            <button class="btn-fullscreen" title="全画面で操作">🔍 全画面</button>\\n' +
          '            <button class="btn-save-file" style="background:#475569;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="この実習のプログラムをファイルに保存">💾 保存</button>\\n' +
          '            <button class="btn-open-file" style="background:#475569;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="ファイルからこの実習のプログラムを読み込む">📂 開く</button>\\n' +
          '            <input type="file" class="input-open-file" accept=".json" style="display:none;">\\n' +
          '          </div>\\n' +
          '        </div>\\n' +
          '      </div>\\n' +
          '      <div class="blockly-embed-body">\\n' +
          '        <div class="blockly-workspace-wrapper">\\n' +
          '          <div class="blockly-workspace-div"></div>\\n' +
          '        </div>\\n' +
          '        <div class="blockly-stage-wrapper">\\n' +
          '          <div class="stage-screen">\\n' +
          '            <div class="stage-screen-banner"></div>\\n' +
          '            <div class="stage-avatar">🐱</div>\\n' +
          '            <div class="stage-speech">こんにちは！</div>\\n' +
          '            <div class="stage-led-label" style="position:absolute;bottom:36px;right:6px;font-size:0.6rem;color:#94a3b8;">💡LED</div>\\n' +
          '            <div class="stage-led"></div>\\n' +
          '            <div class="stage-screen-label">シミュレータ</div>\\n' +
          '          </div>\\n' +
          '          <div class="stage-sensor-row" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;font-size:0.8rem;color:#94a3b8;">\\n' +
          '            <span>🌞 センサー値(明るさ):</span>\\n' +
          '            <button class="btn-sensor-minus" style="background:#334155;color:#e2e8f0;border:none;width:24px;height:24px;border-radius:4px;cursor:pointer;font-weight:bold;">−</button>\\n' +
          '            <span class="stage-sensor-value" style="min-width:2em;text-align:center;color:#facc15;font-weight:bold;">15</span>\\n' +
          '            <button class="btn-sensor-plus" style="background:#334155;color:#e2e8f0;border:none;width:24px;height:24px;border-radius:4px;cursor:pointer;font-weight:bold;">＋</button>\\n' +
          '          </div>\\n' +
          '          <div class="stage-button-row">\\n' +
          '            <span class="stage-button-indicator"></span>\\n' +
          '            <span>🟢 ボタン</span>\\n' +
          '          </div>\\n' +
          '          <div class="stage-logs"></div>\\n' +
          '          <!-- 📄 3言語 (DNCL / Python / JS) リアルタイム・コード変換プレビュー領域 (DNCL左端初期表示・表示切り替え付き) -->\\n' +
          '          <div class="code-preview-box" data-current-lang="dncl" style="margin-top:10px;background:#090d16;border:1px solid #334155;border-radius:6px;padding:8px;font-size:0.8rem;">\\n' +
          '            <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;border-bottom:1px solid #334155;padding-bottom:4px;">\\n' +
          '              <button class="lang-tab active" data-lang="dncl" style="background:#2563eb;color:white;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">🇯🇵 DNCL</button>\\n' +
          '              <button class="lang-tab" data-lang="python" style="background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">🐍 Python</button>\\n' +
          '              <button class="lang-tab" data-lang="js" style="background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">⚡ JS</button>\\n' +
          '              <button class="btn-toggle-code" style="margin-left:auto;background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;" title="コード変換枠の表示/非表示切り替え">👁️ コードを隠す</button>\\n' +
          '            </div>\\n' +
          '            <pre class="code-preview-content" style="margin:0;color:#38bdf8;font-family:monospace;white-space:pre-wrap;word-break:break-all;max-height:110px;overflow-y:auto;">// DNCL (共通テスト手順記述) リアルタイム変換コード</pre>\\n' +
          '          </div>\\n' +
          '        </div>\\n' +
          '      </div>';

        this.ctx = { x: 0, rot: 0, score: 0, ledOn: false, sensorValue: 15, vars: new Map(), funcs: {} };
        this.stepQueue = null;
        this.stepIndex = 0;

        this.querySelector('.btn-run').addEventListener('click', () => this.run());
        this.querySelector('.btn-step').addEventListener('click', () => this.step());
        this.querySelector('.btn-reset').addEventListener('click', () => this.restoreInitialLayout());
        this.querySelector('.btn-ud').addEventListener('click', (e) => this.toggleUdMode(e.currentTarget));
        this.querySelector('.btn-fullscreen').addEventListener('click', (e) => this.toggleFullscreen(e.currentTarget));
        this.querySelectorAll('.lang-tab').forEach(btn => {
          btn.addEventListener('click', (e) => this.switchCodeLang(e.currentTarget, e.currentTarget.dataset.lang));
        });
        this.querySelector('.btn-toggle-code').addEventListener('click', (e) => this.toggleCodePreview(e.currentTarget));
        this.querySelector('.btn-sensor-minus').addEventListener('click', () => this.adjustSensor(-5));
        this.querySelector('.btn-sensor-plus').addEventListener('click', () => this.adjustSensor(5));
        this.querySelector('.btn-save-file').addEventListener('click', () => this.exportToFile());
        const fileInput = this.querySelector('.input-open-file');
        this.querySelector('.btn-open-file').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) this.importFromFile(file);
          fileInput.value = '';
        });
      }

      // ページがactiveになった時に呼ばれる。現在表示中のページの分だけ遅延初期化するための
      // エントリポイント（initBlocklyWorkspacesInActivePage から呼ばれる）。
      ensureWorkspace() {
        if (typeof Blockly === 'undefined') return;
        const wsDiv = this.querySelector('.blockly-workspace-div');
        if (!wsDiv) return;

        if (!wsDiv.workspace) {
          const presetKey = this.dataset.preset || 'ch01-1';
          const preset = PRESETS[presetKey] || PRESETS['ch01-1'];
          try {
            const isSmallScreen = (window.innerWidth <= 768) || (window.innerHeight > window.innerWidth && window.innerWidth <= 1024);
            const tbPos = isSmallScreen ? 'top' : 'start';

            const workspace = Blockly.inject(wsDiv, {
              toolbox: preset.toolboxXml,
              toolboxPosition: tbPos,
              horizontalLayout: isSmallScreen,
              scrollbars: true,
              trashcan: true,
              zoom: { controls: true, wheel: true }
            });
            wsDiv.workspace = workspace;

            // 各課題専用の初期配置ブロック XML の自動復元ロード
            this.loadInitialXmlInto(workspace, preset);

            // 自動保存された状態があれば、教材付属の初期配置の代わりにそちらを復元する。
            this.restoreAutoSavedState(presetKey);

            workspace.addChangeListener((e) => {
              if (e.type !== Blockly.Events.UI) this.updateCodePreview();
              this.scheduleAutoSave(presetKey);
            });

            if (workspace.setKeyboardAccessibilityMode) {
              workspace.setKeyboardAccessibilityMode(false);
            }
          } catch (e) {
            console.error("Blockly init error:", e);
          }
        }

        // 表示確定後にリサイズ ＆ 画面中央にブロックをスクロール表示
        setTimeout(() => {
          if (wsDiv.workspace) {
            Blockly.svgResize(wsDiv.workspace);
            if (typeof wsDiv.workspace.scrollCenter === 'function') {
              wsDiv.workspace.scrollCenter();
            }
            this.updateCodePreview();
            this.updateStageVisibility();
          }
        }, 60);
      }

      getWorkspace() {
        const wsDiv = this.querySelector('.blockly-workspace-div');
        return wsDiv ? wsDiv.workspace : null;
      }

      // 教材付属の初期配置ブロック(preset.initXml)をワークスペースへ読み込む。
      // ensureWorkspace()（初回表示時）とrestoreInitialLayout()（🔄リセット、
      // 初期配置に戻す操作）の両方から呼ばれる共通処理。
      loadInitialXmlInto(workspace, preset) {
        if (!preset || !preset.initXml || !Blockly.utils || !Blockly.utils.xml) return;
        try {
          const dom = Blockly.utils.xml.textToDom(preset.initXml);
          Blockly.Xml.domToWorkspace(dom, workspace);
        } catch (err) {
          console.error('InitXml domToWorkspace failed:', err);
        }
      }

      // ワークスペース保存復元機能の共通基盤。「実習別ファイル保存/読込」
      // 「自動保存・起動時復元」「全件ファイル保存/読込」の3需要は、すべて
      // このsave/load 2関数（Blockly.serialization経由のJSON直列化）の
      // 上に成り立つ（保存先がlocalStorageかファイルかの違いのみ）。
      saveWorkspaceState() {
        const ws = this.getWorkspace();
        if (!ws || typeof Blockly === 'undefined' || !Blockly.serialization) return null;
        try {
          return Blockly.serialization.workspaces.save(ws);
        } catch (e) {
          console.error('ワークスペースの直列化に失敗しました:', e);
          return null;
        }
      }

      loadWorkspaceState(state) {
        const ws = this.getWorkspace();
        if (!ws || !state || typeof Blockly === 'undefined' || !Blockly.serialization) return false;
        try {
          ws.clear();
          Blockly.serialization.workspaces.load(state, ws);
          this.updateCodePreview();
          this.updateStageVisibility();
          return true;
        } catch (e) {
          console.error('ワークスペースの読み込みに失敗しました:', e);
          return false;
        }
      }

      // 自動保存・起動時復元。最多の用途は「前の授業の続きから始める」こと、
      // 最多の環境は1人1台端末（GIGAスクール構想等）であるという判断から、
      // localStorage（ブラウザを閉じても消えない）を使う。共有端末（PC教室等）
      // で前の生徒のブロックが残ってしまう場合は、後述のrestoreInitialLayout()
      // （🔄リセットボタン、確認ダイアログ付きで初期配置に戻す）で対応する
      // 想定（2026-08-16、ユーザー判断：sessionStorageは日をまたぐ多数派の
      // 利便性を損なうため不採用に変更）。
      static autoSaveKey(presetKey) {
        return 'gakushucho_ws_' + presetKey;
      }

      scheduleAutoSave(presetKey) {
        clearTimeout(this._autoSaveTimer);
        this._autoSaveTimer = setTimeout(() => this.autoSaveNow(presetKey), 500);
      }

      autoSaveNow(presetKey) {
        const state = this.saveWorkspaceState();
        if (!state) return;
        try {
          localStorage.setItem(BlocklyLab.autoSaveKey(presetKey), JSON.stringify(state));
        } catch (e) { /* localStorageが使えない環境では自動保存を無効化するのみ */ }
      }

      restoreAutoSavedState(presetKey) {
        let raw = null;
        try {
          raw = localStorage.getItem(BlocklyLab.autoSaveKey(presetKey));
        } catch (e) { return; }
        if (!raw) return;
        try {
          this.loadWorkspaceState(JSON.parse(raw));
        } catch (e) {
          console.error('自動保存データの復元に失敗しました:', e);
        }
      }

      clearAutoSaved(presetKey) {
        try {
          localStorage.removeItem(BlocklyLab.autoSaveKey(presetKey));
        } catch (e) { /* no-op */ }
      }

      // 実習別ファイルエクスポート：この<blockly-lab>1つ分だけをJSONファイルに保存する。
      exportToFile() {
        const state = this.saveWorkspaceState();
        if (!state) return;
        const presetKey = this.dataset.preset || 'gakushucho';
        const payload = { app: 'gakushucho', kind: 'single', presetKey: presetKey, savedAt: new Date().toISOString(), workspace: state };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = presetKey + '_わたしのプログラム.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // 実習別ファイルインポート：ファイルからこの<blockly-lab>1つへ読み込む。
      // 実習が異なるファイル（presetKeyの不一致）でも、ブロック構成が
      // 実際に互換であれば読み込みを許可する（厳密な一致チェックはしない）。
      importFromFile(file) {
        const logs = this.querySelector('.stage-logs');
        const reader = new FileReader();
        reader.onload = () => {
          let payload;
          try {
            payload = JSON.parse(String(reader.result));
          } catch (e) {
            if (logs) logs.innerHTML = '<p style="color:#f87171;">⚠️ ファイルの形式が正しくありません。</p>';
            return;
          }
          const state = payload && payload.workspace ? payload.workspace : payload;
          const ok = this.loadWorkspaceState(state);
          if (logs) {
            logs.innerHTML = ok
              ? '<p style="color:#4ade80;">📂 ファイルからプログラムを読み込みました。</p>'
              : '<p style="color:#f87171;">⚠️ このファイルはこの実習と互換性が無いようです。</p>';
          }
        };
        reader.onerror = () => {
          if (logs) logs.innerHTML = '<p style="color:#f87171;">⚠️ ファイルの読み込みに失敗しました。</p>';
        };
        reader.readAsText(file);
      }

      resetCtxState() {
        const ctx = this.ctx;
        ctx.x = 0; ctx.rot = 0; ctx.score = 0; ctx.ledOn = false; ctx.sensorValue = 15;
        ctx.vars.clear(); ctx.funcs = {};
      }

      adjustSensor(delta) {
        this.ctx.sensorValue = Math.max(0, Math.min(100, this.ctx.sensorValue + delta));
        const span = this.querySelector('.stage-sensor-value');
        if (span) span.textContent = String(this.ctx.sensorValue);
      }

      // LED・光センサー・ボタンの表示方針: 「配置して実行中だけ表示、実行終了で非表示」。
      // ワークスペースに該当ブロックが実際に含まれているか(usesLed等)と、
      // 実行中かどうか(this._running、run()/step()/restoreInitialLayout()側で管理)の
      // 両方が真のときだけ表示する。新しいブロック種別は増やさず、
      // 既存のled_on/led_off・sensor_light・event_buttonの有無だけで判定する。
      //
      // 【光センサーのみ例外】センサー値の+/-調整UIは「実行結果を示す出力」
      // （LED・ボタン）ではなく「実行前に値を設定する入力」であるため、実行中
      // だけに限定すると設定そのものができなくなってしまう（実行を始めないと
      // 表示されず、表示されないと値を設定できない、という矛盾）。そのため
      // センサーだけは「この実習で使われている間はずっと表示」とし、実行中
      // 限定にはしない。これは要件を完全には満たせなかった部分として、
      // devel/overview.mdにも明記する。
      updateStageVisibility() {
        const ws = this.getWorkspace();
        const blocks = ws ? ws.getAllBlocks(false) : [];
        const usesLed = blocks.some(b => b.type === 'led_on' || b.type === 'led_off');
        const usesSensor = blocks.some(b => b.type === 'sensor_light');
        const usesButton = blocks.some(b => b.type === 'event_button');
        const show = !!this._running;

        const ledLabel = this.querySelector('.stage-led-label');
        const ledEl = this.querySelector('.stage-led');
        const sensorRow = this.querySelector('.stage-sensor-row');
        const buttonRow = this.querySelector('.stage-button-row');
        if (ledLabel) ledLabel.style.display = (usesLed && show) ? '' : 'none';
        if (ledEl) ledEl.style.display = (usesLed && show) ? '' : 'none';
        if (sensorRow) sensorRow.style.display = usesSensor ? 'flex' : 'none';
        if (buttonRow) buttonRow.style.display = (usesButton && show) ? 'flex' : 'none';
      }

      // 画面遷移(screen_switch)の視覚表現。ブロックの機能・生成コードには手を触れず、
      // ステージ上の見た目だけで切り替わりを分かりやすくする。「クイズ」「結果」を
      // 含む画面名には専用の色味を、それ以外の自由な画面名には文字列からの簡易
      // ハッシュで一定の色味を割り当てるフォールバックを用意する。
      showScreenTransition(screenName) {
        const stageScreen = this.querySelector('.stage-screen');
        const banner = this.querySelector('.stage-screen-banner');
        if (!stageScreen || !banner) return;

        banner.textContent = '🖼️ ' + screenName;
        banner.classList.remove('theme-quiz', 'theme-result');
        if (/クイズ|問題/.test(screenName)) {
          banner.classList.add('theme-quiz');
        } else if (/結果|スコア/.test(screenName)) {
          banner.classList.add('theme-result');
        } else {
          let hash = 0;
          for (let i = 0; i < screenName.length; i++) hash = (hash * 31 + screenName.charCodeAt(i)) >>> 0;
          const hue = hash % 360;
          banner.style.background = 'hsla(' + hue + ', 70%, 40%, 0.9)';
        }
        banner.classList.add('visible');

        stageScreen.classList.remove('screen-flash');
        void stageScreen.offsetWidth; // reflow強制でアニメーションを再トリガーする
        stageScreen.classList.add('screen-flash');
      }

      toggleFullscreen(btn) {
        const isFullscreen = this.classList.toggle('fullscreen-mode');
        btn.textContent = isFullscreen ? '🗗 画面を戻す' : '🔍 全画面';
        document.body.style.overflow = isFullscreen ? 'hidden' : '';

        const wsDiv = this.querySelector('.blockly-workspace-div');
        if (wsDiv && wsDiv.workspace) {
          setTimeout(() => {
            Blockly.svgResize(wsDiv.workspace);
          }, 100);
        }
      }

      toggleUdMode(btn) {
        const wsDiv = this.querySelector('.blockly-workspace-div');
        if (!wsDiv || !wsDiv.workspace) return;

        const ws = wsDiv.workspace;
        const isUdOn = btn.classList.toggle('ud-active');

        if (isUdOn) {
          btn.textContent = '♿ UD操作: ON';
          btn.style.background = '#eab308';
          btn.style.color = '#0f172a';
          if (ws.setKeyboardAccessibilityMode) ws.setKeyboardAccessibilityMode(true);
        } else {
          btn.textContent = '♿ UD操作: OFF';
          btn.style.background = '#475569';
          btn.style.color = 'white';
          if (ws.setKeyboardAccessibilityMode) ws.setKeyboardAccessibilityMode(false);
        }
      }

      updateCodePreview(lang) {
        const wsDiv = this.querySelector('.blockly-workspace-div');
        const preview = this.querySelector('.code-preview-content');
        if (!wsDiv || !wsDiv.workspace || !preview) return;

        const currentLang = lang || this.querySelector('.code-preview-box')?.getAttribute('data-current-lang') || 'python';
        const ws = wsDiv.workspace;
        let code = '';

        try {
          if (currentLang === 'python') {
            const pyG = getPyGen();
            if (pyG && typeof pyG.workspaceToCode === 'function') {
              code = pyG.workspaceToCode(ws);
            }
            if (!code || !code.trim()) code = "# ブロックを配置すると、ここにリアルタイムで Python 3 コードが自動生成されます";
          } else if (currentLang === 'dncl') {
            if (typeof Blockly !== 'undefined' && Blockly.DNCL && typeof Blockly.DNCL.workspaceToCode === 'function') {
              code = Blockly.DNCL.workspaceToCode(ws);
            }
            if (!code || !code.trim()) code = "// ブロックを配置すると、ここにリアルタイムで DNCL (共通テスト手順記述) が自動生成されます";
          } else {
            const jsG = getJsGen();
            if (jsG && typeof jsG.workspaceToCode === 'function') {
              code = jsG.workspaceToCode(ws);
            }
            if (!code || !code.trim()) code = "// ブロックを配置すると、ここにリアルタイムで JavaScript コードが自動生成されます";
          }
        } catch (e) {
          code = "// コード変換エラー: " + e.message;
        }
        preview.textContent = code.trim();
      }

      switchCodeLang(btn, lang) {
        const box = btn.closest('.code-preview-box');
        if (!box) return;

        box.querySelectorAll('.lang-tab').forEach(b => {
          b.style.background = '#334155';
          b.style.color = '#cbd5e1';
        });
        btn.style.background = '#2563eb';
        btn.style.color = 'white';
        box.setAttribute('data-current-lang', lang);

        const content = box.querySelector('.code-preview-content');
        if (content && content.style.display === 'none') {
          content.style.display = 'block';
          const toggleBtn = box.querySelector('.btn-toggle-code');
          if (toggleBtn) {
            toggleBtn.textContent = '👁️ コードを隠す';
            toggleBtn.style.background = '#334155';
          }
        }

        this.updateCodePreview(lang);
      }

      toggleCodePreview(btn) {
        const box = btn.closest('.code-preview-box');
        if (!box) return;
        const content = box.querySelector('.code-preview-content');
        if (!content) return;

        if (content.style.display === 'none') {
          content.style.display = 'block';
          btn.textContent = '👁️ コードを隠す';
          btn.style.background = '#334155';
        } else {
          content.style.display = 'none';
          btn.textContent = '🙈 コードを表示';
          btn.style.background = '#020617';
        }
      }

      // 値ブロック(出力を持つブロック)を再帰的に評価して実際のJS値を返す
      evaluateValue(block, ctx) {
        if (!block) return null;
        switch (block.type) {
          case 'math_number': return Number(block.getFieldValue('NUM')) || 0;
          case 'text': return block.getFieldValue('TEXT') || '';
          case 'logic_boolean': return block.getFieldValue('BOOL') === 'TRUE';
          case 'sensor_light': return ctx.sensorValue;
          case 'var_score_get': return ctx.score;
          case 'variables_get': {
            const name = block.getField && block.getField('VAR') ? block.getField('VAR').getText() : '';
            return ctx.vars.has(name) ? ctx.vars.get(name) : 0;
          }
          case 'logic_compare': {
            const a = this.evaluateValue(block.getInputTargetBlock('A'), ctx);
            const b = this.evaluateValue(block.getInputTargetBlock('B'), ctx);
            const op = block.getFieldValue('OP');
            if (op === 'EQ') return a == b;
            if (op === 'NEQ') return a != b;
            if (op === 'LT') return a < b;
            if (op === 'LTE') return a <= b;
            if (op === 'GT') return a > b;
            if (op === 'GTE') return a >= b;
            return false;
          }
          case 'math_arithmetic': {
            const a = Number(this.evaluateValue(block.getInputTargetBlock('A'), ctx)) || 0;
            const b = Number(this.evaluateValue(block.getInputTargetBlock('B'), ctx)) || 0;
            const op = block.getFieldValue('OP');
            if (op === 'ADD') return a + b;
            if (op === 'MINUS') return a - b;
            if (op === 'MULTIPLY') return a * b;
            if (op === 'DIVIDE') return b !== 0 ? a / b : 0;
            if (op === 'POWER') return Math.pow(a, b);
            return 0;
          }
          case 'lists_create_with': {
            const count = block.itemCount_ || 0;
            const arr = [];
            for (let i = 0; i < count; i++) arr.push(this.evaluateValue(block.getInputTargetBlock('ADD' + i), ctx));
            return arr;
          }
          case 'lists_getIndex': {
            const list = this.evaluateValue(block.getInputTargetBlock('VALUE'), ctx);
            const at = Math.round(Number(this.evaluateValue(block.getInputTargetBlock('AT'), ctx))) || 0;
            return Array.isArray(list) ? list[at] : undefined;
          }
          case 'lists_length': {
            const list = this.evaluateValue(block.getInputTargetBlock('VALUE'), ctx);
            return Array.isArray(list) ? list.length : 0;
          }
          case 'procedures_callreturn': {
            const result = this.callFunction(block, ctx, 0);
            return result === undefined ? 0 : result;
          }
          case 'algo_linear_search': {
            const list = this.evaluateValue(block.getInputTargetBlock('LIST'), ctx);
            const target = this.evaluateValue(block.getInputTargetBlock('TARGET'), ctx);
            if (!Array.isArray(list)) return -1;
            for (let i = 0; i < list.length; i++) {
              if (list[i] === target) return i;
            }
            return -1;
          }
          case 'algo_binary_search': {
            const list = this.evaluateValue(block.getInputTargetBlock('LIST'), ctx);
            const target = this.evaluateValue(block.getInputTargetBlock('TARGET'), ctx);
            if (!Array.isArray(list)) return -1;
            let lo = 0, hi = list.length - 1;
            while (lo <= hi) {
              const mid = Math.floor((lo + hi) / 2);
              if (list[mid] === target) return mid;
              if (list[mid] < target) lo = mid + 1; else hi = mid - 1;
            }
            return -1;
          }
          case 'algo_bubble_sort': {
            const list = this.evaluateValue(block.getInputTargetBlock('LIST'), ctx);
            if (!Array.isArray(list)) return [];
            const arr = list.slice();
            for (let i = 0; i < arr.length - 1; i++) {
              for (let j = 0; j < arr.length - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                  const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
                }
              }
            }
            return arr;
          }
          default:
            return null;
        }
      }

      // 名前解決した関数(procedures_defnoreturn/defreturn)の中身を実行し、
      // 戻り値ありの場合はRETURN入力を評価して返す（同期的・非アニメーション）
      callFunction(callBlock, ctx, depth) {
        const name = callBlock.getFieldValue('NAME');
        const def = ctx.funcs[name];
        if (!def || depth > 20) return undefined;
        if (def.arguments_) {
          def.arguments_.forEach((argName, i) => {
            ctx.vars.set(argName, this.evaluateValue(callBlock.getInputTargetBlock('ARG' + i), ctx));
          });
        }
        if (def.type === 'procedures_defreturn') {
          return this.evaluateValue(def.getInputTargetBlock('RETURN'), ctx);
        }
        return undefined;
      }

      // ワークスペース内の procedures_defnoreturn / defreturn を名前引きできるよう収集
      buildFuncTable(workspace) {
        const funcs = {};
        workspace.getTopBlocks(true).forEach(b => {
          if (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') {
            const name = b.getFieldValue('NAME');
            if (name) funcs[name] = b;
          }
        });
        return funcs;
      }

      // 文ブロック1つを「見える1ステップ」に展開する（入れ子を持つ型は再帰的に中身も展開）
      expandBlock(block, ctx, depth) {
        const type = block.type;

        if (type === 'procedures_defnoreturn' || type === 'procedures_defreturn') {
          return []; // 定義そのものは実行ステップではない（呼び出された時だけ中身を展開する）
        }

        if (type === 'controls_if' || type === 'controls_ifelse') {
          const elseIfCount = block.elseifCount_ || 0;
          let taken = null;
          for (let i = 0; i <= elseIfCount; i++) {
            const condBlock = block.getInputTargetBlock('IF' + i);
            if (condBlock && this.evaluateValue(condBlock, ctx)) { taken = 'DO' + i; break; }
          }
          if (!taken && block.elseCount_) taken = 'ELSE';
          const steps = [{ block, kind: 'if', taken: !!taken }];
          if (taken) {
            const bodyBlock = block.getInputTargetBlock(taken);
            if (bodyBlock) steps.push(...this.collectSteps(bodyBlock, ctx, depth));
          }
          return steps;
        }

        if (type === 'controls_repeat_ext') {
          const timesBlock = block.getInputTargetBlock('TIMES');
          let times = Math.round(Number(this.evaluateValue(timesBlock, ctx))) || 0;
          times = Math.max(0, Math.min(times, 100));
          const steps = [{ block, kind: 'repeat', times }];
          const doBlock = block.getInputTargetBlock('DO');
          for (let i = 0; i < times && steps.length < 500; i++) {
            if (doBlock) steps.push(...this.collectSteps(doBlock, ctx, depth));
          }
          return steps;
        }

        if (type === 'controls_whileUntil') {
          const until = block.getFieldValue('MODE') === 'UNTIL';
          const doBlock = block.getInputTargetBlock('DO');
          const steps = [{ block, kind: 'while' }];
          let iter = 0;
          while (iter < 100 && steps.length < 500) {
            const condBlock = block.getInputTargetBlock('BOOL');
            let cond = condBlock ? !!this.evaluateValue(condBlock, ctx) : false;
            if (until) cond = !cond;
            if (!cond) break;
            if (doBlock) steps.push(...this.collectSteps(doBlock, ctx, depth));
            iter++;
          }
          return steps;
        }

        if (type === 'procedures_callnoreturn' || type === 'procedures_callreturn') {
          const name = block.getFieldValue('NAME');
          const steps = [{ block, kind: 'call', name }];
          const def = ctx.funcs[name];
          if (def && depth < 20) {
            if (def.arguments_) {
              def.arguments_.forEach((argName, i) => {
                ctx.vars.set(argName, this.evaluateValue(block.getInputTargetBlock('ARG' + i), ctx));
              });
            }
            const bodyBlock = def.getInputTargetBlock ? def.getInputTargetBlock('STACK') : null;
            if (bodyBlock) steps.push(...this.collectSteps(bodyBlock, ctx, depth + 1));
          }
          return steps;
        }

        // それ以外は単発の「動作」ブロックとして1ステップ扱い
        return [{ block, kind: 'action' }];
      }

      // ブロックチェーン(getNextBlock())を辿りつつ、各ブロックを再帰的に展開してフラットな配列にする
      collectSteps(block, ctx, depth) {
        depth = depth || 0;
        const steps = [];
        let curr = block;
        let guard = 0;
        while (curr && guard < 500 && steps.length < 500) {
          guard++;
          steps.push(...this.expandBlock(curr, ctx, depth));
          curr = curr.getNextBlock();
        }
        return steps;
      }

      // 1ステップぶんの視覚効果・ログを適用する（run/stepの両方から共通で呼ぶ）
      applyStep(step, ctx, stepNum) {
        const avatar = this.querySelector('.stage-avatar');
        const speech = this.querySelector('.stage-speech');
        const ledEl = this.querySelector('.stage-led');
        const logs = this.querySelector('.stage-logs');
        const block = step.block;
        const type = block.type;
        const prefix = stepNum != null ? '[' + stepNum + 'ステップ] ' : '';
        let logLine = null;

        if (step.kind === 'if') {
          logLine = '🔀 ' + prefix + 'もし〜ならば、を判定しました（' + (step.taken ? '条件が成立したので中身を実行' : '条件が成立せず、実行される中身なし') + '）';
        } else if (step.kind === 'repeat') {
          logLine = '🔁 ' + prefix + step.times + '回の繰り返しを開始しました';
        } else if (step.kind === 'while') {
          logLine = '🔁 ' + prefix + '条件付き繰り返しを開始しました';
        } else if (step.kind === 'call') {
          logLine = '📞 ' + prefix + '「' + step.name + '」を呼び出しました';
        } else if (type === 'move_steps') {
          const steps = parseInt(block.getFieldValue('STEPS') || '10', 10);
          ctx.x += steps * 3;
          if (avatar) avatar.style.transform = 'translateX(' + ctx.x + 'px) rotate(' + ctx.rot + 'deg)';
          logLine = '🐾 ' + prefix + steps + '歩 進みました (位置: ' + ctx.x + 'px)';
        } else if (type === 'turn_right') {
          const deg = parseInt(block.getFieldValue('DEGREES') || '90', 10);
          ctx.rot = (ctx.rot + deg) % 360;
          if (avatar) avatar.style.transform = 'translateX(' + ctx.x + 'px) rotate(' + ctx.rot + 'deg)';
          logLine = '↪️ ' + prefix + '右に ' + deg + '度 曲がりました (角度: ' + ctx.rot + '度)';
        } else if (type === 'say_text') {
          const txt = block.getFieldValue('TEXT') || 'こんにちは！';
          if (speech) { speech.textContent = txt; speech.style.opacity = '1'; }
          logLine = '💬 ' + prefix + '「' + txt + '」と表示しました';
        } else if (type === 'text_print') {
          const val = this.evaluateValue(block.getInputTargetBlock('TEXT'), ctx);
          const txt = (val === null || val === undefined) ? '(空)' : String(val);
          if (speech) { speech.textContent = txt; speech.style.opacity = '1'; }
          logLine = '💬 ' + prefix + '「' + txt + '」と表示しました';
        } else if (type === 'sound_play' || type === 'play_meow') {
          if (avatar) {
            avatar.style.transform = 'translateX(' + ctx.x + 'px) rotate(' + ctx.rot + 'deg) scale(1.3)';
            setTimeout(() => { if (avatar) avatar.style.transform = 'translateX(' + ctx.x + 'px) rotate(' + ctx.rot + 'deg)'; }, 300);
          }
          logLine = '🎵 ' + prefix + (type === 'play_meow' ? 'ニャーと鳴く' : '音を鳴らす');
        } else if (type === 'event_button') {
          const indicator = this.querySelector('.stage-button-indicator');
          if (indicator) {
            indicator.classList.add('pressed');
            setTimeout(() => indicator.classList.remove('pressed'), 400);
          }
          logLine = '🟢 ' + prefix + 'ボタンが押されました（実行開始）';
        } else if (type === 'led_on' || type === 'led_off') {
          ctx.ledOn = (type === 'led_on');
          if (ledEl) ledEl.classList.toggle('on', ctx.ledOn);
          logLine = '💡 ' + prefix + (ctx.ledOn ? 'LEDを点灯しました' : 'LEDを消灯しました');
        } else if (type === 'screen_switch') {
          const screenName = block.getFieldValue('SCREEN') || '';
          this.showScreenTransition(screenName);
          logLine = '🖼️ ' + prefix + '画面を「' + screenName + '」にしました';
        } else if (type === 'var_score_set') {
          ctx.score = parseInt(block.getFieldValue('VAL') || '0', 10);
          logLine = '📊 ' + prefix + 'スコアを ' + ctx.score + ' にしました';
        } else if (type === 'var_score_change') {
          const delta = parseInt(block.getFieldValue('DELTA') || '0', 10);
          ctx.score += delta;
          logLine = '📊 ' + prefix + 'スコアを ' + delta + ' 変えました（現在 ' + ctx.score + '）';
        } else if (type === 'show_score') {
          logLine = '📊 ' + prefix + 'スコア「' + ctx.score + '」を表示しました';
        } else if (type === 'variables_set') {
          const name = block.getField && block.getField('VAR') ? block.getField('VAR').getText() : '変数';
          const val = this.evaluateValue(block.getInputTargetBlock('VALUE'), ctx);
          ctx.vars.set(name, val);
          logLine = '📦 ' + prefix + name + ' に ' + val + ' を代入しました';
        } else {
          logLine = '⚡ ' + prefix + type + ' 命令の実行完了';
        }

        if (logs && logLine) logs.innerHTML += '<p style="color:#4ade80;">' + logLine + '</p>';
      }

      async run() {
        const ws = this.getWorkspace();
        const btn = this.querySelector('.btn-run');
        const speech = this.querySelector('.stage-speech');
        const logs = this.querySelector('.stage-logs');
        if (!ws) return;

        const topBlocks = ws.getTopBlocks(true);
        if (logs) logs.innerHTML = '<p style="color:#38bdf8;font-weight:bold;">▶ プログラム実行開始</p>';

        if (topBlocks.length === 0) {
          if (logs) logs.innerHTML += '<p style="color:#f59e0b;">⚠️ ブロックが配置されていません。</p>';
          if (speech) {
            speech.textContent = 'ブロックを置いてね！';
            speech.style.opacity = '1';
            setTimeout(() => { speech.style.opacity = '0'; }, 2000);
          }
          return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ 実行中...';
        this.resetSimState(); // 実行のたびに前回までの状態(位置・LED・スコア等)を引きずらない
        this._running = true;
        this.updateStageVisibility();
        const ctx = this.ctx;
        ctx.funcs = this.buildFuncTable(ws);

        const allSteps = [];
        topBlocks.forEach(rootBlock => { allSteps.push(...this.collectSteps(rootBlock, ctx, 0)); });

        for (const step of allSteps) {
          if (ws.highlightBlock) ws.highlightBlock(step.block.id);
          this.applyStep(step, ctx, null);
          await delay(500);
        }
        if (ws.highlightBlock) ws.highlightBlock(null);

        if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべての命令の実行が完了しました！</p>';
        btn.disabled = false;
        btn.textContent = '▶ 実行';
        this._running = false;
        this.updateStageVisibility();
      }

      step() {
        const ws = this.getWorkspace();
        if (!ws) return;
        const logs = this.querySelector('.stage-logs');

        if (!this.stepQueue || this.stepQueue.length === 0) {
          const topBlocks = ws.getTopBlocks(true);
          if (topBlocks.length === 0) {
            if (logs) logs.innerHTML = '<p style="color:#f59e0b;">⚠️ ブロックが配置されていません。</p>';
            return;
          }
          this.resetSimState(); // コマ送りを新しく始めるたびに前回までの状態を引きずらない
          const ctx = this.ctx;
          ctx.funcs = this.buildFuncTable(ws);
          this.stepQueue = [];
          topBlocks.forEach(rootBlock => { this.stepQueue.push(...this.collectSteps(rootBlock, ctx, 0)); });
          this.stepIndex = 0;
          if (logs) logs.innerHTML = '<p style="color:#ea580c;font-weight:bold;">⏯️ コマ送り実行中...</p>';
          this._running = true;
          this.updateStageVisibility();
        }

        if (this.stepIndex >= this.stepQueue.length) {
          if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべてのコマ送りが完了しました！</p>';
          this.stepQueue = null;
          if (ws.highlightBlock) ws.highlightBlock(null);
          this._running = false;
          this.updateStageVisibility();
          return;
        }

        const step = this.stepQueue[this.stepIndex];
        this.stepIndex++;

        if (ws.highlightBlock) ws.highlightBlock(step.block.id);
        this.applyStep(step, this.ctx, this.stepIndex);

        if (this.stepIndex >= this.stepQueue.length) {
          setTimeout(() => {
            if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべてのコマ送りが完了しました！</p>';
            this.stepQueue = null;
            this._running = false;
            this.updateStageVisibility();
          }, 300);
        }
      }

      // シミュレーション状態（アバター位置・LED・スコア・センサー表示・画面遷移
      // バナー等）だけをリセットする。ブロック自体には一切触れない。
      // run()/step()の開始時に必ず呼ばれるため、実行するたびに前回までの状態を
      // 引きずらない（2026-08-16、ユーザー指摘：実行開始時に必ずリセットすれば、
      // 生徒が明示的に押す専用の「実行状態リセット」ボタンは不要になるはず、との
      // 判断により、この呼び出し元をrun()/step()に一本化した）。
      resetSimState() {
        const ws = this.getWorkspace();
        if (ws && ws.highlightBlock) ws.highlightBlock(null);
        this.stepQueue = null;

        const avatar = this.querySelector('.stage-avatar');
        const speech = this.querySelector('.stage-speech');
        const ledEl = this.querySelector('.stage-led');
        const sensorSpan = this.querySelector('.stage-sensor-value');
        const banner = this.querySelector('.stage-screen-banner');

        this.resetCtxState();
        const ctx = this.ctx;

        if (avatar) avatar.style.transform = 'none';
        if (speech) speech.style.opacity = '0';
        if (ledEl) ledEl.classList.remove('on');
        if (sensorSpan) sensorSpan.textContent = String(ctx.sensorValue);
        if (banner) banner.classList.remove('visible');
      }

      // 「🔄 リセット」ボタンの実体。ユーザー指摘（2026-08-16）：実行状態の
      // リセットよりも「ブロックをうっかり消してしまった／散らかしすぎた際に
      // 教材本来の初期配置に戻したい」という需要の方が多いはず、との判断で、
      // このボタンの意味を「初期配置に戻す」に変更した。現在のブロックを
      // 破棄する破壊的操作のため確認ダイアログを挟む。共有端末（PC教室等）で
      // 前の生徒のブロックが残っている場合の対処にも使える。
      restoreInitialLayout() {
        const ws = this.getWorkspace();
        if (!ws) return;
        if (!confirm('現在のブロックを全て消して、教材の初期配置に戻します。よろしいですか？')) return;

        const presetKey = this.dataset.preset || 'ch01-1';
        const preset = PRESETS[presetKey] || PRESETS['ch01-1'];
        this._running = false;
        ws.clear();
        this.loadInitialXmlInto(ws, preset);
        this.clearAutoSaved(presetKey);
        this.resetSimState();
        this.updateCodePreview();
        this.updateStageVisibility();

        const logs = this.querySelector('.stage-logs');
        if (logs) logs.innerHTML = '<p style="color:#94a3b8;">初期配置に戻しました。▶ 実行ボタンを押してね。</p>';
      }
    }
    customElements.define('blockly-lab', BlocklyLab);

    // 現在表示中のページに含まれる <blockly-lab> だけを遅延初期化する
    // （全24節ぶんのBlocklyワークスペースを一括初期化すると重いため、以前からの性能特性を維持）。
    function initBlocklyWorkspacesInActivePage(pageEl) {
      if (!pageEl) return;
      pageEl.querySelectorAll('blockly-lab').forEach(el => {
        if (el.ensureWorkspace) el.ensureWorkspace();
      });
    }

    // 全件ファイルエクスポート・インポート（保存復元機能の3需要のうち「全件」）。
    // localStorageに現在残っている「gakushucho_ws_」接頭辞の自動保存データを
    // まとめて1ファイルにする／まとめて書き戻すだけで、各<blockly-lab>個別の
    // 保存復元機能(saveWorkspaceState/loadWorkspaceState)とは別の直列化処理は
    // 持たない（同じ土台の上に成り立つ設計）。
    const AUTO_SAVE_PREFIX = 'gakushucho_ws_';

    function exportAllWorkspaceData() {
      const bundle = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.indexOf(AUTO_SAVE_PREFIX) === 0) {
            bundle[key.slice(AUTO_SAVE_PREFIX.length)] = JSON.parse(localStorage.getItem(key));
          }
        }
      } catch (e) { /* localStorage不可の環境では空のまま */ }

      const payload = { app: 'gakushucho', kind: 'all', savedAt: new Date().toISOString(), workspaces: bundle };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gakushucho_全実習_保存データ.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function importAllWorkspaceData(file) {
      const reader = new FileReader();
      reader.onload = () => {
        let payload;
        try {
          payload = JSON.parse(String(reader.result));
        } catch (e) {
          alert('ファイルの形式が正しくありません。');
          return;
        }
        const workspaces = (payload && payload.workspaces) || {};
        let count = 0;
        try {
          for (const presetKey in workspaces) {
            localStorage.setItem(AUTO_SAVE_PREFIX + presetKey, JSON.stringify(workspaces[presetKey]));
            count++;
          }
        } catch (e) {
          alert('保存データの書き込みに失敗しました（この端末ではストレージが使えない可能性があります）。');
          return;
        }
        // 現在ページに表示中の<blockly-lab>があれば、その場で読み込み直す
        document.querySelectorAll('blockly-lab').forEach(el => {
          const presetKey = el.dataset.preset;
          if (presetKey && workspaces[presetKey] && el.getWorkspace()) {
            el.loadWorkspaceState(workspaces[presetKey]);
          }
        });
        alert(count + '件の実習データを読み込みました。各実習のページを開くと反映されています。');
      };
      reader.readAsText(file);
    }

    (function initAllDataButtons() {
      // top-barはこのscriptタグより前にパース済みのため、イベント待ちは不要
      // （window.addEventListener('load', handleHashChange)と同じ前提）。
      const exportBtn = document.getElementById('btnAllDataExport');
      const importBtn = document.getElementById('btnAllDataImport');
      const importInput = document.getElementById('inputAllDataImport');
      if (exportBtn) exportBtn.addEventListener('click', exportAllWorkspaceData);
      if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) importAllWorkspaceData(file);
          importInput.value = '';
        });
      }
    })();

    // Escキーでの選択解除 ＆ 全画面モーダル終了処理
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.blockly-embed-container.fullscreen-mode').forEach(c => {
          c.classList.remove('fullscreen-mode');
          document.body.style.overflow = '';
          const wsDiv = c.querySelector('.blockly-workspace-div');
          if (wsDiv && wsDiv.workspace) Blockly.svgResize(wsDiv.workspace);
        });
      }
    });

    const delay = ms => new Promise(res => setTimeout(res, ms));

    function navigateTo(idx, scrollToElementId) {
      activePages = getActivePages();
      if (idx < 0 || idx >= activePages.length) idx = 0;
      currentIndex = idx;

      document.querySelectorAll('.section-page').forEach(el => el.classList.remove('active'));
      const targetPage = activePages[currentIndex];
      if (targetPage) {
        const activeEl = document.getElementById('page-' + targetPage.id);
        if (activeEl) activeEl.classList.add('active');

        renderNavs();

        if (scrollToElementId) {
          setTimeout(() => {
            const targetEl = document.getElementById(scrollToElementId);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.scrollTo(0, 0);
            }
          }, 100);
        } else {
          window.scrollTo(0, 0);
        }

        // ページの表示後に Blockly ワークスペースをアクティブ表示確定状態で初期化 ＆ 中央スクロール表示
        setTimeout(() => {
          initBlocklyWorkspacesInActivePage(activeEl);
        }, 50);

        document.getElementById('prevBtn').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
        document.getElementById('nextBtn').style.visibility = currentIndex === activePages.length - 1 ? 'hidden' : 'visible';
        document.getElementById('pageIndicator').textContent = (currentIndex + 1) + ' / ' + activePages.length;

        const newHash = scrollToElementId ? '#' + scrollToElementId : '#' + targetPage.id;
        history.replaceState(null, '', newHash);
      }
    }

    function closeMobileMenu() {
      const container = document.getElementById('sidebarContainer');
      const icon = document.getElementById('toggleIcon');
      if (container) container.classList.remove('open');
      if (icon) icon.textContent = '▼ 開く';
    }

    document.getElementById('mobileSelectNav').addEventListener('change', (e) => {
      navigateTo(parseInt(e.target.value, 10));
    });

    document.getElementById('mobileToggleBtn').addEventListener('click', () => {
      const container = document.getElementById('sidebarContainer');
      const icon = document.getElementById('toggleIcon');
      const isOpen = container.classList.toggle('open');
      icon.textContent = isOpen ? '▲ 閉じる' : '▼ 開く';
    });

    document.getElementById('prevBtn').addEventListener('click', () => navigateTo(currentIndex - 1));
    document.getElementById('nextBtn').addEventListener('click', () => navigateTo(currentIndex + 1));

    function handleHashChange() {
      activePages = getActivePages();
      let hash = location.hash.replace('#', '');
      if (hash.includes('?')) {
        hash = hash.split('?')[0];
      }
      if (!hash) {
        navigateTo(0);
        return;
      }

      // 1. ページIDに直接一致するか検索
      let foundIdx = activePages.findIndex(p => p.id === hash);
      let targetElementId = null;

      if (foundIdx < 0) {
        // 2. ページIDに直接一致しない場合、DOM内の要素ID (例: #setup_guide) を検索
        const targetEl = document.getElementById(hash);
        if (targetEl) {
          const parentPage = targetEl.closest('.section-page');
          if (parentPage) {
            const pageId = parentPage.getAttribute('data-page-id');
            foundIdx = activePages.findIndex(p => p.id === pageId);
            targetElementId = hash;
          }
        }
      }

      if (foundIdx >= 0) {
        navigateTo(foundIdx, targetElementId);
      } else {
        navigateTo(0);
      }
    }

    window.addEventListener('load', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
  </script>
</body>
</html>`;

  const outputPath = path.join(targetDir, 'gakushucho.html');
  fs.writeFileSync(outputPath, fullSpaHtml, 'utf-8');
  console.log(`  Generated Single Integrated SPA: ${path.relative(rootDir, outputPath)} (${pagesList.length} 節ページ切り替え対応)`);
  // 旧個別サブポータルの生成処理は撤去し、トップ統合ポータル index.html へ一元化
}

// Blockly実習プリセット（data-preset属性の参照先）。値はBlocklyツールボックス/初期配置のXML文字列。
// クライアント側スクリプトへは JSON.stringify で埋め込む（build.js:1056付近）。
const PRESETS = {
  'ch01-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="sound_play"></block><block type="say_text"></block><block type="move_steps"></block><block type="play_meow"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">こんにちは！</field><next><block type="sound_play"></block></next></block></xml>'
  },
  'ch01-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text"></block><block type="move_steps"></block><block type="turn_right"></block><block type="play_meow"></block><block type="sound_play"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">はじめまして！</field><next><block type="move_steps"><field name="STEPS">10</field><next><block type="play_meow"></block></next></block></next></block></xml>'
  },
  'ch01-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="move_steps"></block><block type="turn_right"></block><block type="say_text"></block><block type="sound_play"></block><block type="play_meow"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="move_steps" x="30" y="30"><field name="STEPS">10</field><next><block type="turn_right"><field name="DEGREES">90</field></block></next></block></xml>'
  },
  'ch02-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block><block type="play_meow"></block><block type="sound_play"></block><block type="move_steps"></block><block type="say_text"></block><block type="math_number"><field name="NUM">5</field></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext" x="30" y="30"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value><statement name="DO"><block type="play_meow"></block></statement></block></xml>'
  },
  'ch02-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if"></block><block type="logic_boolean"></block><block type="sound_play"></block><block type="say_text"></block><block type="move_steps"></block><block type="play_meow"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if" x="30" y="30"><value name="IF0"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value><statement name="DO0"><block type="sound_play"></block></statement></block></xml>'
  },
  'ch02-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block><block type="controls_if"></block><block type="logic_boolean"></block><block type="move_steps"></block><block type="sound_play"></block><block type="say_text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext" x="30" y="30"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value><statement name="DO"><block type="controls_if"><value name="IF0"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value><statement name="DO0"><block type="move_steps"><field name="STEPS">5</field></block></statement></block></statement></block></xml>'
  },
  'ch03-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block><block type="move_steps"></block><block type="turn_right"></block><block type="math_number"><field name="NUM">120</field></block><block type="say_text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext" x="30" y="30"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value><statement name="DO"><block type="move_steps"><field name="STEPS">80</field><next><block type="turn_right"><field name="DEGREES">120</field></block></next></block></statement></block></xml>'
  },
  'ch03-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if"></block><block type="sensor_light"></block><block type="led_on"></block><block type="led_off"></block><block type="sound_play"></block><block type="say_text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if" x="30" y="30"><statement name="DO0"><block type="led_on"></block></statement></block></xml>'
  },
  'ch03-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if"></block><block type="say_text"></block><block type="sound_play"></block><block type="math_number"><field name="NUM">3</field></block><block type="logic_boolean"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if" x="30" y="30"><statement name="DO0"><block type="say_text"><field name="TEXT">3の倍数！</field></block></statement></block></xml>'
  },
  'ch04-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button"></block><block type="say_text"></block><block type="sound_play"></block><block type="move_steps"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button" x="30" y="30"><next><block type="say_text"><field name="TEXT">ようこそ！</field></block></next></block></xml>'
  },
  'ch04-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button"></block><block type="screen_switch"></block><block type="say_text"></block><block type="sound_play"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button" x="30" y="30"><next><block type="screen_switch"><field name="SCREEN">クイズ画面</field></block></next></block></xml>'
  },
  'ch04-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="var_score_set"></block><block type="var_score_change"></block><block type="show_score"></block><block type="event_button"></block><block type="say_text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="var_score_set" x="30" y="30"><field name="VAL">0</field><next><block type="var_score_change"><field name="DELTA">10</field></block></next></block></xml>'
  },
  'ch05-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button"></block><block type="screen_switch"></block><block type="var_score_set"></block><block type="var_score_change"></block><block type="var_score_get"></block><block type="show_score"></block><block type="say_text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button" x="30" y="30"><next><block type="var_score_set"><field name="VAL">0</field><next><block type="screen_switch"><field name="SCREEN">結果画面</field></block></next></block></next></block></xml>'
  },
  'ch05-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if"></block><block type="logic_compare"></block><block type="sensor_light"></block><block type="math_number"><field name="NUM">28</field></block><block type="led_on"></block><block type="led_off"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if" x="30" y="30"><value name="IF0"><block type="logic_compare"><field name="OP">LT</field><value name="A"><block type="sensor_light"></block></value><value name="B"><block type="math_number"><field name="NUM">28</field></block></value></block></value><statement name="DO0"><block type="led_on"></block></statement></block></xml>'
  },
  'ch05-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if"></block><block type="logic_compare"></block><block type="sensor_light"></block><block type="math_number"><field name="NUM">28</field></block><block type="led_on"></block><block type="led_off"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_if" x="30" y="30"><value name="IF0"><block type="logic_compare"><field name="OP">GT</field><value name="A"><block type="sensor_light"></block></value><value name="B"><block type="math_number"><field name="NUM">28</field></block></value></block></value><statement name="DO0"><block type="led_on"></block></statement></block></xml>'
  },
  'ch06-1': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="lists_create_with"><mutation items="3"></mutation></block><block type="lists_getIndex"><mutation statement="false" at="true"></mutation><field name="MODE">GET</field><field name="WHERE">FROM_START</field></block><block type="lists_length"></block><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block><block type="controls_whileUntil"></block><block type="logic_compare"></block><block type="variables_get"></block><block type="variables_set"></block><block type="math_arithmetic"></block><block type="math_number"><field name="NUM">0</field></block><block type="text_print"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="text_print" x="30" y="30"><value name="TEXT"><block type="lists_getIndex"><mutation statement="false" at="true"></mutation><field name="MODE">GET</field><field name="WHERE">FROM_START</field><value name="VALUE"><block type="lists_create_with"><mutation items="5"></mutation><value name="ADD0"><block type="math_number"><field name="NUM">85</field></block></value><value name="ADD1"><block type="math_number"><field name="NUM">92</field></block></value><value name="ADD2"><block type="math_number"><field name="NUM">78</field></block></value><value name="ADD3"><block type="math_number"><field name="NUM">90</field></block></value><value name="ADD4"><block type="math_number"><field name="NUM">88</field></block></value></block></value><value name="AT"><block type="math_number"><field name="NUM">0</field></block></value></block></value></block></xml>'
  },
  'ch06-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="procedures_defnoreturn"></block><block type="procedures_defreturn"></block><block type="math_number"><field name="NUM">0</field></block><block type="logic_compare"></block><block type="controls_if"></block><block type="text_print"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="procedures_defnoreturn" x="30" y="30"><field name="NAME">あいさつする</field><statement name="STACK"><block type="say_text"><field name="TEXT">こんにちは、関数です！</field></block></statement></block><block type="procedures_callnoreturn" x="30" y="150"><mutation name="あいさつする"></mutation></block></xml>'
  },
  'ch06-3': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="algo_linear_search"></block><block type="algo_binary_search"></block><block type="algo_bubble_sort"></block><block type="lists_create_with"><mutation items="5"></mutation></block><block type="controls_if"></block><block type="logic_compare"></block><block type="math_number"><field name="NUM">0</field></block><block type="text_print"></block><block type="variables_get"></block><block type="variables_set"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="text_print" x="30" y="30"><value name="TEXT"><block type="algo_linear_search"><value name="LIST"><block type="lists_create_with"><mutation items="5"></mutation><value name="ADD0"><block type="math_number"><field name="NUM">85</field></block></value><value name="ADD1"><block type="math_number"><field name="NUM">92</field></block></value><value name="ADD2"><block type="math_number"><field name="NUM">78</field></block></value><value name="ADD3"><block type="math_number"><field name="NUM">90</field></block></value><value name="ADD4"><block type="math_number"><field name="NUM">88</field></block></value></block></value><value name="TARGET"><block type="math_number"><field name="NUM">78</field></block></value></block></value></block></xml>'
  },
  'ch07-2': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button"></block><block type="screen_switch"></block><block type="var_score_set"></block><block type="var_score_change"></block><block type="var_score_get"></block><block type="show_score"></block><block type="say_text"></block><block type="sound_play"></block><block type="move_steps"></block><block type="turn_right"></block><block type="play_meow"></block><block type="controls_if"></block><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block><block type="logic_boolean"></block><block type="sensor_light"></block><block type="led_on"></block><block type="led_off"></block><block type="text_print"></block><block type="math_number"><field name="NUM">0</field></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_button" x="30" y="30"><next><block type="say_text"><field name="TEXT">ここから自由に作ってみよう！</field></block></next></block></xml>'
  },
  'default': {
    toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block><block type="controls_if"></block><block type="move_steps"></block><block type="turn_right"></block><block type="say_text"></block><block type="sound_play"></block><block type="play_meow"></block><block type="math_number"><field name="NUM">10</field></block><block type="logic_boolean"></block><block type="text_print"></block><block type="text"></block></xml>',
    initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">プログラムを組んでみよう！</field></block></xml>'
  }
};

// ブロック学習帳 独自カスタムブロック群（Blockly.defineBlocksWithJsonArray に渡すJSON定義）。
// クライアント側スクリプトへは PRESETS 同様 JSON.stringify で埋め込む（旧版より復元）。
// tests/dncl-codegen.spec.js（ブラウザ無しのDNCL生成関数ユニットテスト）でも、
// PRESETSのinitXmlをワークスペースへ読み込む際のブロック定義として共用する。
const CUSTOM_BLOCKS = [
  { "type": "sound_play", "message0": "🎵 音を鳴らす", "previousStatement": null, "nextStatement": null, "colour": 260 },
  { "type": "say_text", "message0": "💬 %1 と言う", "args0": [{"type": "field_input", "name": "TEXT", "text": "こんにちは！"}], "previousStatement": null, "nextStatement": null, "colour": 160 },
  { "type": "move_steps", "message0": "🐾 %1 歩進む", "args0": [{"type": "field_number", "name": "STEPS", "value": 10}], "previousStatement": null, "nextStatement": null, "colour": 230 },
  { "type": "play_meow", "message0": "🐱 ニャーと鳴く", "previousStatement": null, "nextStatement": null, "colour": 300 },
  { "type": "turn_right", "message0": "↪️ 右に %1 度曲がる", "args0": [{"type": "field_number", "name": "DEGREES", "value": 90}], "previousStatement": null, "nextStatement": null, "colour": 230 },
  { "type": "sensor_light", "message0": "☀️ 明るさセンサーの値", "output": "Number", "colour": 100 },
  { "type": "led_on", "message0": "💡 LEDを点灯する", "previousStatement": null, "nextStatement": null, "colour": 120 },
  { "type": "led_off", "message0": "💡 LEDを消灯する", "previousStatement": null, "nextStatement": null, "colour": 120 },
  { "type": "event_button", "message0": "🟢 ボタンが押されたとき", "nextStatement": null, "colour": 20 },
  { "type": "screen_switch", "message0": "🖼️ 画面を %1 にする", "args0": [{"type": "field_input", "name": "SCREEN", "text": "クイズ画面"}], "previousStatement": null, "nextStatement": null, "colour": 260 },
  { "type": "var_score_get", "message0": "スコア", "output": "Number", "colour": 330 },
  { "type": "var_score_change", "message0": "スコア を %1 ずつ変える", "args0": [{"type": "field_number", "name": "DELTA", "value": 1}], "previousStatement": null, "nextStatement": null, "colour": 330 },
  { "type": "var_score_set", "message0": "スコア を %1 にする", "args0": [{"type": "field_number", "name": "VAL", "value": 0}], "previousStatement": null, "nextStatement": null, "colour": 330 },
  { "type": "show_score", "message0": "📊 スコアを表示する", "previousStatement": null, "nextStatement": null, "colour": 330 },
  { "type": "algo_linear_search", "message0": "🔍 リスト %1 から %2 を線形探索する", "args0": [{"type": "input_value", "name": "LIST"}, {"type": "input_value", "name": "TARGET"}], "inputsInline": true, "output": "Number", "colour": 45, "tooltip": "先頭から順に調べ、見つかった位置(0から)を返す。見つからなければ-1" },
  { "type": "algo_binary_search", "message0": "🔍 整列済みリスト %1 から %2 を二分探索する", "args0": [{"type": "input_value", "name": "LIST"}, {"type": "input_value", "name": "TARGET"}], "inputsInline": true, "output": "Number", "colour": 45, "tooltip": "中央の値と比べながら探索範囲を半分ずつに絞り込み、見つかった位置(0から)を返す。見つからなければ-1。リストは昇順に整列済みであることが前提" },
  { "type": "algo_bubble_sort", "message0": "🔃 リスト %1 をバブルソートする", "args0": [{"type": "input_value", "name": "LIST"}], "inputsInline": true, "output": "Array", "colour": 45, "tooltip": "隣り合う要素を比較・交換して昇順に並べ替えた新しいリストを返す（元のリストは変更しない）" }
];

// gakushucho.md 全体が参照する data-preset="..." を抽出し、PRESETS のキーと突き合わせる。
// 未定義キーへの参照はビルドを失敗させる（従来は PRESETS[key] || PRESETS['ch01-1'] で無言フォールバックしていた）。
// どの data-preset からも参照されない PRESETS キーは、将来の章向けの予約分の可能性があるため警告のみ。
function validatePresetReferences(sections, presets) {
  const allText = Object.values(sections).join('\n');
  const usedKeys = [];
  const regex = /data-preset="([^"]+)"/g;
  let m;
  while ((m = regex.exec(allText)) !== null) {
    usedKeys.push(m[1]);
  }
  const definedKeys = Object.keys(presets);
  const missing = [...new Set(usedKeys.filter(k => !definedKeys.includes(k)))];
  if (missing.length > 0) {
    throw new Error(`gakushucho.md が参照する data-preset のうち、PRESETS に未定義のキーがあります: ${missing.join(', ')}`);
  }
  const usedSet = new Set(usedKeys);
  const unused = definedKeys.filter(k => k !== 'default' && !usedSet.has(k));
  if (unused.length > 0) {
    console.warn(`  [警告] PRESETSに定義されているが、どのdata-presetからも参照されていないキー: ${unused.join(', ')}`);
  }
}

// generateSingleGakushuchoHtml等がクロージャ経由で参照するため、モジュールトップレベルに置く
let contentStats;
let portalCards;

// 実際のビルド実行（ファイル書き込み等の副作用）をrunBuild()にまとめ、build_all.js等から
// 明示的に呼び出す形にする。テストコードは module.exports 経由で純粋ロジックだけを使える。
function runBuild() {

const masterSections = parseMasterMd();
validatePresetReferences(masterSections, PRESETS);
contentStats = computeContentStats(masterSections);
portalCards = parsePortalCards(masterSections);

console.log('\n=== Building Single Integrated SPA gakushucho.html ===');
generateSingleGakushuchoHtml(masterSections, rootDir, true, '📘 『ブロック学習帳』');

// devel/*.html コンパイル生成
console.log('\n=== Building devel/*.html (内部開発用ドキュメント類 [ref01, changelog]) ===');
generateDevelHTML();

// index.html トップポータル生成
console.log('\n=== Building index.html Portal ===');
const portalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>『ブロック学習帳』 統合ポータル</title>
  <style>${commonCss}</style>
  <script>${commonComponentsScript}</script>
</head>
<body>
  <div class="top-bar">
    <div class="title">🚀 『ブロック学習帳』 統合ポータル</div>
    <div></div>
  </div>
  <div class="container">
    <h1>小・中・高対応 プログラミング・情報教材 『ブロック学習帳』</h1>
    <p style="font-size:1.05rem;line-height:1.7;color:#334155;margin-bottom:20px;">
      『ブロック学習帳』へようこそ！小学校の基礎から中学校技術科、高等学校「情報Ⅰ」まで、インストール不要・オフラインで安心してお使いいただける統合型プログラミング学習教材です。児童生徒が直感的に動かせるブロック操作から、共通テスト標準言語 (DNCL) や Python へのステップアップまでスムーズに接続します。
    </p>

    <!-- 🌟 最新のお知らせ・更新履歴インライン掲載 -->
    <gakushu-note kind="announcement" style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <h3 style="margin:0;color:#92400e;font-size:1.05rem;display:flex;align-items:center;gap:6px;">
          <span>🌟 最新のお知らせ・更新履歴 (News)</span>
        </h3>
        <a href="gakushucho.html?teach=1#news" style="font-size:0.85rem;color:#b45309;font-weight:bold;text-decoration:underline;">詳細ページを見る ➔</a>
      </div>
      
      <!-- レスポンシブ スクロールコンテナ -->
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table is="gakushu-table" class="gakushu-table" role="table" style="min-width:280px;">
          <tr>
            <th style="width:120px;">日付</th>
            <th>区分</th>
          </tr>
          <tr>
            <td style="font-weight:bold;color:#1e293b;">2026/07/30</td>
            <td style="font-weight:bold;color:#ea580c;">プロジェクト開始</td>
          </tr>
          <tr>
            <td style="color:#64748b;">2026/--/--</td>
            <td style="font-weight:bold;color:#d97706;">クローズドβテスト開始</td>
          </tr>
          <tr>
            <td style="color:#64748b;">2026/--/--</td>
            <td style="font-weight:bold;color:#2563eb;">オープンβテスト開始</td>
          </tr>
        </table>
      </div>
      <p style="margin:8px 0 0 0;font-size:0.8rem;color:#b45309;line-height:1.5;">
        ※ 変更内容の詳細はオープンβテスト開始以降に記載します。
      </p>
    </gakushu-note>

    <gakushu-note kind="highlight">
      <h3 style="margin-top:0;color:var(--primary-color);display:flex;align-items:center;gap:8px;">
        <span>📦 オフライン設置用 一括配布パッケージ ＆ セットアップ手順</span>
      </h3>
      <p style="margin-bottom:16px;font-size:0.95rem;color:var(--text-color);">
        校内Webサーバーや端末のローカル環境へ導入・設置するための全ファイルを含むZIPパッケージです。
      </p>

      <gakushu-note kind="neutral" style="margin-bottom:16px;font-size:0.9rem;">
        <div style="font-weight:bold;margin-bottom:8px;color:#1e293b;">💡 簡単・安心の2ステップ設置手順：</div>
        <ol style="margin:0;padding-left:20px;line-height:1.7;">
          <li><strong>① 指導者用フォルダの準備:</strong> <code>指導者用</code> フォルダを作成し、<code>gakushucho.zip</code> を全解凍します（全指導案付きで起動）。</li>
          <li><strong>② 学習者用フォルダの準備:</strong> <code>学習者用</code> フォルダを作成して解凍後、<code>js/teach.js</code> を削除して生徒端末へ配付します（指導案非表示で安心起動）。</li>
        </ol>
      </gakushu-note>

      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <a href="gakushucho.zip" style="display:inline-flex;align-items:center;gap:6px;background:var(--primary-color);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
          <span>📦 gakushucho.zip をダウンロード</span>
        </a>
        <a href="gakushucho.html?teach=1#setup" style="display:inline-flex;align-items:center;gap:6px;background:#475569;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
          <span>📖 詳細な導入・セットアップガイドを見る</span>
        </a>
      </div>
    </gakushu-note>

    <div class="card-grid" style="margin-top:24px;">
      <a class="card" href="gakushucho.html?teach=0">
        <gakushu-tag kind="blue">学習者用</gakushu-tag>
        <div class="card-title">📘 ブロック学習帳</div>
        <div class="card-desc">小学校・中学校・高校生が直接ブロックを組み立てて直感的に学ぶ学習ツール（全${contentStats.chapterCount}章${contentStats.totalSections}節）</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1">
        <gakushu-tag kind="green">指導者用</gakushu-tag>
        <div class="card-title">📗 指導用学習帳</div>
        <div class="card-desc">全${contentStats.chapterCount}章の学習帳、指導者用解説、統合ガイドライン、詳細指導案を網羅した指導者用ツール</div>
      </a>
      ${['setup', 'overview', 'news', 'teacher_appendix', 'lesson_plan'].map((key, i) => {
        const card = portalCards[key];
        const num = '①②③④⑤'[i];
        if (!card) return `<!-- portal_cardsセクションに ${key} のCARD定義がありません -->`;
        const title = inlineFormatting(fillCardPlaceholders(card.title, contentStats));
        const desc = inlineFormatting(fillCardPlaceholders(card.desc, contentStats));
        return `<a class="card" href="gakushucho.html?teach=1#${key}">
        <gakushu-tag kind="${card.tagKind}">巻末付録${num}</gakushu-tag>
        <div class="card-title">${title}</div>
        <div class="card-desc">${desc}</div>
      </a>`;
      }).join('\n      ')}
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(rootDir, 'index.html'), portalHtml, 'utf-8');
console.log('  Generated: ' + path.relative(rootDir, path.join(rootDir, 'index.html')));

// gakushucho.zip 自動生成
console.log('\n=== Creating Public Package gakushucho.zip ===');
try {
  const zipPath = path.join(rootDir, 'gakushucho.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  // .htaccess, devel/(非公開開発資料), build/devel/(非公開開発資料ソース), answers/(個人用回答控え), gakushucho.zip, .git/, node_modules/ を除外
  const cmd = `cd ${rootDir} && zip -r gakushucho.zip . -x ".htaccess" ".*" "devel/*" "devel" "build/devel/*" "build/devel" "answers/*" "gakushucho.zip" ".git/*" "node_modules/*"`;
  execSync(cmd);
  console.log('  Generated Public Package: gakushucho.zip (' + fs.statSync(zipPath).size + ' bytes)');
} catch (e) {
  console.error('Failed to create gakushucho.zip:', e);
}

console.log('\n=== Build completed successfully! ===\n');

} // function runBuild()

module.exports = {
  parseMasterMd, mdToHtml, getSortedChapterKeys, splitChapterSections, cleanSectionHeading,
  extractH1Title, computeContentStats, validatePresetReferences, buildLessonPlanHtml, PRESETS, CUSTOM_BLOCKS, runBuild,
  parsePortalCards, fillCardPlaceholders
};

if (require.main === module) {
  runBuild();
}
