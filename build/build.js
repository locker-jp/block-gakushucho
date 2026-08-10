// 『ブロック学習帳』 単一統合SPAコンパイラ (全自動一括ビルド最新版)
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
const reportsDir = path.join(rootDir, 'reports');
const masterMdPath = path.join(buildDir, 'gakushucho.md');

[buildDir, develOutputDir, reportsDir].forEach(d => {
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
`;

const guideAnnotationCss = `
.teacher-guide-annotation {
  background-color: #f0fdf4;
  border-left: 4px solid #16a34a;
  padding: 16px 20px;
  margin: 20px 0;
  border-radius: 0 8px 8px 0;
}
.teacher-guide-annotation h3 {
  color: #15803d;
  margin-top: 0;
  font-size: 1.05rem;
}
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
    return `<details class="choice-hint-details" style="margin:12px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:8px;padding:10px 14px;">
      <summary style="cursor:pointer;font-weight:bold;color:#166534;user-select:none;outline:none;">💡 考え方・回答の選択肢ヒントを見る ▼</summary>
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #a7f3d0;font-size:0.9rem;color:#1e293b;">
        <strong>【選択肢ヒント】：</strong> ${hintText}
      </div>
    </details>`;
  });

  if (isGuide) {
    cleanMd = cleanMd.replace(/<!-- teacher-guide-start -->/g, '<div class="teacher-guide-annotation">');
    cleanMd = cleanMd.replace(/<!-- teacher-guide-end -->/g, '</div>');
  }

  cleanMd = cleanMd.replace(/<div class="blockly-embed" data-preset="([^"]+)" data-title="([^"]+)"><\/div>/g, (m, preset, title) => {
    const formattedTitle = title.replace(/体験コーナー/g, '実習：つないでみよう！');
    return `<div class="blockly-embed-container" data-preset="${preset}" data-title="${formattedTitle}">
      <div class="blockly-embed-header">
        <span class="blockly-embed-title">🧩 ${formattedTitle}</span>
        <div class="embed-controls" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <div class="controls-row-top" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button class="btn-run" onclick="runBlocklyDemo(this)">▶ 実行</button>
            <button class="btn-step" onclick="stepBlocklyDemo(this)" style="background:#ea580c;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="1命令ずつステップ実行（デバッグ学習）">⏯️ コマ送り</button>
            <button class="btn-reset" onclick="resetBlocklyDemo(this)">🔄 リセット</button>
          </div>
          <div class="controls-row-bottom" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button class="btn-ud" onclick="toggleUdMode(this)" style="background:#475569;color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;" title="キーボード・タップ選択操作の切り替え">♿ UD操作: OFF</button>
            <button class="btn-fullscreen" onclick="toggleFullscreenEmbed(this)" title="全画面で操作">🔍 全画面</button>
          </div>
        </div>
      </div>
      <div class="blockly-embed-body">
        <div class="blockly-workspace-wrapper">
          <div class="blockly-workspace-div"></div>
        </div>
        <div class="blockly-stage-wrapper">
          <div class="stage-screen">
            <div class="stage-avatar">🐱</div>
            <div class="stage-speech">こんにちは！</div>
            <div class="stage-led"></div>
            <div class="stage-screen-label">シミュレータ</div>
          </div>
          <div class="stage-logs"></div>
          <!-- 📄 3言語 (DNCL / Python / JS) リアルタイム・コード変換プレビュー領域 (DNCL左端初期表示・表示切り替え付き) -->
          <div class="code-preview-box" data-current-lang="dncl" style="margin-top:10px;background:#090d16;border:1px solid #334155;border-radius:6px;padding:8px;font-size:0.8rem;">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;border-bottom:1px solid #334155;padding-bottom:4px;">
              <button onclick="switchCodeLang(this, 'dncl')" class="lang-tab active" style="background:#2563eb;color:white;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">🇯🇵 DNCL</button>
              <button onclick="switchCodeLang(this, 'python')" class="lang-tab" style="background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">🐍 Python</button>
              <button onclick="switchCodeLang(this, 'js')" class="lang-tab" style="background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;">⚡ JS</button>
              <button onclick="toggleCodePreview(this)" class="btn-toggle-code" style="margin-left:auto;background:#334155;color:#cbd5e1;border:none;padding:2px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer;" title="コード変換枠の表示/非表示切り替え">👁️ コードを隠す</button>
            </div>
            <pre class="code-preview-content" style="margin:0;color:#38bdf8;font-family:monospace;white-space:pre-wrap;word-break:break-all;max-height:110px;overflow-y:auto;">// DNCL (共通テスト手順記述) リアルタイム変換コード</pre>
          </div>
        </div>
      </div>
    </div>`;
  });

  const lines = cleanMd.split('\n');
  let html = '';
  let inTable = false;
  let tableHeaderDone = false;

  let inCustomBlock = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('<div class="blockly-embed-container"')) {
      inCustomBlock = true;
    }
    if (line.includes('</div></div></div></div>')) { // 末尾
      inCustomBlock = false;
    }

    if (line.startsWith('<div class="teacher-guide-annotation">')) {
      if (inTable) { html += '</table>\n'; inTable = false; }
      html += '<div class="teacher-guide-annotation">\n';
      continue;
    }
    if (line.startsWith('</div>') && !inCustomBlock) {
      if (inTable) { html += '</table>\n'; inTable = false; }
      html += '</div>\n';
      continue;
    }

    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        html += '<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #cbd5e1;">\n';
      }
      if (line.includes('---')) {
        tableHeaderDone = true;
        continue;
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!tableHeaderDone) {
        html += '  <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;">\n';
        cells.forEach(c => { html += `    <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:left;">${inlineFormatting(c, relPrefix)}</th>\n`; });
        html += '  </tr>\n';
      } else {
        html += '  <tr style="border-bottom:1px solid #e2e8f0;">\n';
        cells.forEach(c => { html += `    <td style="padding:8px 12px;border:1px solid #e2e8f0;">${inlineFormatting(c, relPrefix)}</td>\n`; });
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
      if (!inCustomBlock && !line.startsWith('<div') && !line.startsWith('</div')) {
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
  // 開発用ファイル (build/devel/ 内の .md) -> devel/ フォルダへ出力 (ref01_project_overview.html, changelog.html の2本のみ)
  const devDocsDir = path.join(buildDir, 'devel');
  if (fs.existsSync(devDocsDir)) {
    const devFiles = fs.readdirSync(devDocsDir).filter(f => f.endsWith('.md'));
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
        <div class="tag" style="background:#e2e8f0;color:#334155;">DEV DOC</div>
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

function buildLessonPlanHtml(sections) {
  const orderKeys = getSortedChapterKeys(sections);
  let lessonPlanHtml = '';
  orderKeys.forEach(k => {
    if (!sections[k]) return;
    const rawText = sections[k];
    const chMatch = k.match(/^ch0*(\d+)$/i);
    if (!chMatch) return;
    const chNum = parseInt(chMatch[1], 10);

    const secParts = rawText.split(/(?=^## )/m);
    let secIdx = 0;

    secParts.forEach((part, index) => {
      if (!part.trim()) return;

      if (index > 0 || part.trim().startsWith('## ')) {
        secIdx++;
        const firstLine = part.trim().split('\n')[0];
        let secTitle = `第${chNum}章 第${secIdx}節`;
        const titleMatch = firstLine.match(/^## (.*$)/);
        if (titleMatch) {
          const cleanTitle = titleMatch[1].replace(/^[0-9]+-[0-9]+\.\s*/, '').trim();
          secTitle = `${chNum}-${secIdx}. ${cleanTitle}`;
        }

        const annotations = [];
        const regex = /<!-- teacher-guide-start -->([\s\S]*?)<!-- teacher-guide-end -->/g;
        let m;
        while ((m = regex.exec(part)) !== null) {
          annotations.push(m[1].trim());
        }

        if (annotations.length > 0) {
          lessonPlanHtml += `<h2 style="color:#15803d;border-bottom:2px solid #bbf7d0;padding-bottom:6px;margin-top:32px;">${secTitle}</h2>\n`;
          annotations.forEach(ann => {
            const parsed = mdToHtml(ann, chNum, secIdx, true);
            lessonPlanHtml += `<div class="teacher-guide-annotation" style="margin-bottom:20px;">\n${parsed}\n</div>\n`;
          });
        }
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

  const titlesMap = {
    setup: '📦 オフライン設置・端末別セットアップガイド',
    overview: '📖 教材概要 ＆ ガイドライン',
    news: '🌟 最新のお知らせ ＆ 更新履歴',
    toc: '📋 目次・学習の進め方',
    appendix: '📎 付録：学習カードとブロックリファレンス',
    teacher_appendix: '📎 指導用付録：観点別評価規準と授業展開表'
  };

  orderKeys.forEach(k => {
    if (!sections[k]) return;
    const rawText = sections[k];

    if (k === 'setup' || k === 'overview' || k === 'news' || k === 'toc' || k === 'appendix' || k === 'teacher_appendix') {
      const pageId = k;
      const title = titlesMap[k];
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

      const secParts = rawText.split(/(?=^## )/m);
      let secIdx = 0;

      secParts.forEach((part, index) => {
        if (!part.trim()) return;

        if (index === 0 && !part.trim().startsWith('## ')) {
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
          secIdx++;
          const pageId = `${chNum}-${secIdx}`;

          let pageTitle = `${chNum}-${secIdx}`;
          const firstLine = part.trim().split('\n')[0];
          const titleMatch = firstLine.match(/^## (.*$)/);
          if (titleMatch) {
            const cleanTitle = titleMatch[1].replace(/^[0-9]+-[0-9]+\.\s*/, '').trim();
            pageTitle = `${chNum}-${secIdx}. ${cleanTitle}`;
          }

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
  pagesList.push({ id: 'lesson_plan', title: '📋 全8章 授業詳細指導案一覧', teacherOnly: true });
  pagesHtml.push(`
    <div id="page-lesson_plan" class="section-page teacher-only-page" data-page-id="lesson_plan" data-page-title="📋 全8章 授業詳細指導案一覧">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
        <h2 style="margin-top:0;color:#166534;">📋 教員・指導者用 詳細指導案一覧</h2>
        <p style="margin:0;font-size:0.9rem;color:#15803d;">全8章26節の授業フロー、口頭メッセージ、観点別評価規準を網羅した指導用参考資料です。</p>
      </div>
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
  <!-- Blockly ライブラリ (授業時オフラインローカル優先 ＆ 自動フォールバック完全描画保障) -->
  <script src="${relPrefix}js/blockly_compressed.js"></script>
  <script src="${relPrefix}js/blocks_compressed.js"></script>
  <script src="${relPrefix}js/javascript_compressed.js"></script>
  <script src="${relPrefix}js/python_compressed.js"></script>
  <script src="${relPrefix}js/dncl_compressed.js"></script>
  <script src="${relPrefix}js/msg/js/ja.js"></script>
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
</head>
<body>
  <div class="top-bar">
    <div class="title">${mainTitle}</div>
    <div>
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
    // 💡 ブロック学習帳 独自カスタムブロック群 (旧版より100%完全復元)
    // -------------------------------------------------------------
    if (typeof Blockly !== 'undefined' && Blockly.defineBlocksWithJsonArray) {
      try {
        Blockly.defineBlocksWithJsonArray([
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
          { "type": "show_score", "message0": "📊 スコアを表示する", "previousStatement": null, "nextStatement": null, "colour": 330 }
        ]);
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
          'show_score': function() { return 'print("スコア:", score)' + String.fromCharCode(10); }
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
          'show_score': function() { return 'showScore();' + String.fromCharCode(10); }
        };
        for (let k in jsFuncs) {
          jsG[k] = jsFuncs[k];
          if (jsG.forBlock) jsG.forBlock[k] = jsFuncs[k];
        }
      }
    }

    const PRESETS = {
      'ch01-1': {
        toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="sound_play"></block><block type="say_text"></block><block type="move_steps"></block><block type="play_meow"></block></xml>',
        initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">こんにちは！</field><next><block type="sound_play"></block></next></block></xml>'
      },
      'ch01-2': {
        toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text"></block><block type="move_steps"></block><block type="turn_right"></block><block type="play_meow"></block><block type="sound_play"></block></xml>',
        initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">はじめまして！</field><next><block type="move_steps"><field name="STEPS">10</field><next><block type="play_meow"></block></next></block></next></block>'
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
      'ch06-1': {
        toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block><block type="text_print"></block><block type="text"></block><block type="say_text"></block></xml>',
        initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext" x="30" y="30"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value><statement name="DO"><block type="text_print"><value name="TEXT"><block type="text"><field name="TEXT">こんにちは！</field></block></value></block></statement></block></xml>'
      },
      'default': {
        toolboxXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block><block type="controls_if"></block><block type="move_steps"></block><block type="turn_right"></block><block type="say_text"></block><block type="sound_play"></block><block type="play_meow"></block><block type="math_number"><field name="NUM">10</field></block><block type="logic_boolean"></block><block type="text_print"></block><block type="text"></block></xml>',
        initXml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="say_text" x="30" y="30"><field name="TEXT">プログラムを組んでみよう！</field></block></xml>'
      }
    };

    function toggleFullscreenEmbed(btn) {
      const container = btn.closest('.blockly-embed-container');
      if (!container) return;
      const isFullscreen = container.classList.toggle('fullscreen-mode');
      btn.textContent = isFullscreen ? '🗗 画面を戻す' : '🔍 全画面';
      document.body.style.overflow = isFullscreen ? 'hidden' : '';

      const wsDiv = container.querySelector('.blockly-workspace-div');
      if (wsDiv && wsDiv.workspace) {
        setTimeout(() => {
          Blockly.svgResize(wsDiv.workspace);
        }, 100);
      }
    }

    function initBlocklyWorkspacesInActivePage(pageEl) {
      if (!pageEl || typeof Blockly === 'undefined') return;
      const containers = pageEl.querySelectorAll('.blockly-embed-container');
      containers.forEach(container => {
        const wsDiv = container.querySelector('.blockly-workspace-div');
        if (!wsDiv) return;

        const presetKey = container.getAttribute('data-preset') || 'ch01-1';
        const preset = PRESETS[presetKey] || PRESETS['ch01-1'];

        if (!wsDiv.workspace) {
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
            if (preset.initXml && Blockly.utils && Blockly.utils.xml) {
              try {
                const dom = Blockly.utils.xml.textToDom(preset.initXml);
                Blockly.Xml.domToWorkspace(dom, workspace);
              } catch (err) {
                console.error("InitXml domToWorkspace failed:", err);
              }
            }

            workspace.addChangeListener(function(e) {
              if (e.type !== Blockly.Events.UI) {
                updateCodePreview(container);
              }
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
            updateCodePreview(container);
          }
        }, 60);
      });
    }

    function toggleUdMode(btn) {
      const container = btn.closest('.blockly-embed-container');
      if (!container) return;
      const wsDiv = container.querySelector('.blockly-workspace-div');
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

    function updateCodePreview(container, lang) {
      if (!container) return;
      const wsDiv = container.querySelector('.blockly-workspace-div');
      const preview = container.querySelector('.code-preview-content');
      if (!wsDiv || !wsDiv.workspace || !preview) return;

      const currentLang = lang || container.querySelector('.code-preview-box')?.getAttribute('data-current-lang') || 'python';
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

    function switchCodeLang(btn, lang) {
      const box = btn.closest('.code-preview-box');
      const container = btn.closest('.blockly-embed-container');
      if (!box || !container) return;

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

      updateCodePreview(container, lang);
    }

    function toggleCodePreview(btn) {
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

    // ステージアバターの位置・回転角度の永続ステート管理
    const stageStates = {};

    function getStageState(container) {
      const presetKey = container.getAttribute('data-preset') || 'default';
      if (!stageStates[presetKey]) {
        stageStates[presetKey] = { x: 0, rot: 0 };
      }
      return stageStates[presetKey];
    }

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function runBlocklyDemo(btn) {
      const container = btn.closest('.blockly-embed-container');
      if (!container) return;
      const wsDiv = container.querySelector('.blockly-workspace-div');
      const avatar = container.querySelector('.stage-avatar');
      const speech = container.querySelector('.stage-speech');
      const led = container.querySelector('.stage-led');
      const logs = container.querySelector('.stage-logs');

      if (!wsDiv || !wsDiv.workspace) return;
      const ws = wsDiv.workspace;
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
      const state = getStageState(container);

      // ブロックの命令列を 0.8秒間隔で 1ステップずつ順次アニメーション実行
      for (const rootBlock of topBlocks) {
        let curr = rootBlock;
        while (curr) {
          const type = curr.type;
          
          if (type === 'move_steps') {
            const steps = parseInt(curr.getFieldValue('STEPS') || '10', 10);
            state.x += steps * 3;
            if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
            if (logs) logs.innerHTML += '<p style="color:#4ade80;">🐾 ' + steps + '歩 進みました (位置: ' + state.x + 'px)</p>';
            await delay(800);
          } else if (type === 'turn_right') {
            const deg = parseInt(curr.getFieldValue('DEGREES') || '90', 10);
            state.rot = (state.rot + deg) % 360;
            if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
            if (logs) logs.innerHTML += '<p style="color:#4ade80;">↪️ 右に ' + deg + '度 曲がりました (角度: ' + state.rot + '度)</p>';
            await delay(800);
          } else if (type === 'say_text' || type === 'text_print') {
            const txt = curr.getFieldValue('TEXT') || 'こんにちは！';
            if (speech) {
              speech.textContent = txt;
              speech.style.opacity = '1';
            }
            if (logs) logs.innerHTML += '<p style="color:#4ade80;">💬 「' + txt + '」と表示しました</p>';
            await delay(1200);
            if (speech) speech.style.opacity = '0';
          } else if (type === 'sound_play' || type === 'play_meow') {
            if (avatar) {
              avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg) scale(1.3)';
              setTimeout(() => {
                if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
              }, 300);
            }
            const soundName = type === 'play_meow' ? 'ニャーと鳴く' : '音を鳴らす';
            if (logs) logs.innerHTML += '<p style="color:#4ade80;">🎵 ' + soundName + '</p>';
            await delay(800);
          } else if (type === 'controls_repeat_ext') {
            const times = parseInt(curr.getFieldValue('TIMES') || '3', 10);
            if (logs) logs.innerHTML += '<p style="color:#facc15;">🔁 ' + times + '回 繰り返し処理</p>';
            await delay(600);
          } else {
            if (logs) logs.innerHTML += '<p style="color:#cbd5e1;">⚡ ' + type + ' 命令の実行完了</p>';
            await delay(600);
          }

          curr = curr.getNextBlock();
        }
      }

      if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべての命令の実行が完了しました！</p>';
      btn.disabled = false;
      btn.textContent = '▶ 実行';
    }

    async function stepBlocklyDemo(btn) {
      const container = btn.closest('.blockly-embed-container');
      if (!container) return;
      const workspace = container._blocklyWorkspace;
      if (!workspace) return;

      const avatar = container.querySelector('.stage-avatar');
      const speech = container.querySelector('.stage-speech');
      const logs = container.querySelector('.stage-logs');

      if (!container._stepQueue || container._stepQueue.length === 0) {
        const topBlocks = workspace.getTopBlocks(true);
        if (topBlocks.length === 0) {
          if (logs) logs.innerHTML = '<p style="color:#f59e0b;">⚠️ ブロックが配置されていません。</p>';
          return;
        }
        container._stepQueue = [];
        topBlocks.forEach(rootBlock => {
          let curr = rootBlock;
          while (curr) {
            container._stepQueue.push(curr);
            curr = curr.getNextBlock();
          }
        });
        container._stepIndex = 0;
        if (logs) logs.innerHTML = '<p style="color:#ea580c;font-weight:bold;">⏯️ コマ送り実行中...</p>';
      }

      if (container._stepIndex >= container._stepQueue.length) {
        if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべてのコマ送りが完了しました！</p>';
        container._stepQueue = null;
        if (workspace.highlightBlock) workspace.highlightBlock(null);
        return;
      }

      const curr = container._stepQueue[container._stepIndex];
      container._stepIndex++;

      if (workspace.highlightBlock) workspace.highlightBlock(curr.id);
      const state = getStageState(container);
      const type = curr.type;

      if (type === 'move_steps') {
        const steps = parseInt(curr.getFieldValue('STEPS') || '10', 10);
        state.x += steps * 3;
        if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
        if (logs) logs.innerHTML += '<p style="color:#4ade80;">🐾 [' + container._stepIndex + 'ステップ] ' + steps + '歩 進みました</p>';
      } else if (type === 'turn_right') {
        const deg = parseInt(curr.getFieldValue('DEGREES') || '90', 10);
        state.rot = (state.rot + deg) % 360;
        if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
        if (logs) logs.innerHTML += '<p style="color:#4ade80;">↪️ [' + container._stepIndex + 'ステップ] 右に ' + deg + '度 曲がりました</p>';
      } else if (type === 'say_text' || type === 'text_print') {
        const txt = curr.getFieldValue('TEXT') || 'こんにちは！';
        if (speech) {
          speech.textContent = txt;
          speech.style.opacity = '1';
        }
        if (logs) logs.innerHTML += '<p style="color:#4ade80;">💬 [' + container._stepIndex + 'ステップ] 「' + txt + '」と表示しました</p>';
      } else if (type === 'sound_play' || type === 'play_meow') {
        if (avatar) {
          avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg) scale(1.3)';
          setTimeout(() => {
            if (avatar) avatar.style.transform = 'translateX(' + state.x + 'px) rotate(' + state.rot + 'deg)';
          }, 300);
        }
        const soundName = type === 'play_meow' ? 'ニャーと鳴く' : '音を鳴らす';
        if (logs) logs.innerHTML += '<p style="color:#4ade80;">🎵 [' + container._stepIndex + 'ステップ] ' + soundName + '</p>';
      } else {
        if (logs) logs.innerHTML += '<p style="color:#cbd5e1;">⚡ [' + container._stepIndex + 'ステップ] ' + type + ' 実行完了</p>';
      }

      if (container._stepIndex >= container._stepQueue.length) {
        setTimeout(() => {
          if (logs) logs.innerHTML += '<p style="color:#38bdf8;font-weight:bold;">🎉 すべてのコマ送りが完了しました！</p>';
          container._stepQueue = null;
        }, 300);
      }
    }

    function resetBlocklyDemo(btn) {
      const container = btn.closest('.blockly-embed-container');
      if (!container) return;
      const workspace = container._blocklyWorkspace;
      if (workspace && workspace.highlightBlock) workspace.highlightBlock(null);
      container._stepQueue = null;

      const avatar = container.querySelector('.stage-avatar');
      const speech = container.querySelector('.stage-speech');
      const logs = container.querySelector('.stage-logs');

      const state = getStageState(container);
      state.x = 0;
      state.rot = 0;

      if (avatar) avatar.style.transform = 'none';
      if (speech) speech.style.opacity = '0';
      if (logs) logs.innerHTML = '<p style="color:#94a3b8;">リセット完了。▶ 実行ボタンを押してね。</p>';
    }


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

  const portalTitle = isGuide ? '📗 『指導用学習帳』 ポータル' : '📘 『ブロック学習帳』 ポータル';
  const subTitle = isGuide ? '教員・指導者向け ガイドライン ＆ 指導案統合ポータル' : '児童・生徒向け プログラミング学習ポータル';
  const desc = isGuide
    ? '指導者用総合ハンドブック、小中高学習指導要領統合要約、授業フロー表、口頭指導メッセージ付きの統合指導ガイドです。'
    : '小学校から高校「情報Ⅰ」まで、ブロックを組み立てて直感的にプログラミングを学べる学習帳です。';

  let portalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portalTitle}</title>
  <style>${commonCss}</style>
</head>
<body>
  <div class="top-bar">
    <div class="title">${portalTitle}</div>
    <div><a href="../index.html">🏠 トップポータル</a></div>
  </div>
  <div class="container">
    <h1>${subTitle}</h1>
    <p>${desc}</p>

    <div class="card-grid" style="margin-top:24px;">
      <a class="card" href="${relPrefix}gakushucho.html">
        <div class="tag" style="background:#dbeafe;color:#1e40af;">メインコンテンツ</div>
        <div class="card-title">📖 学習帳本体を開く</div>
        <div class="card-desc">全8章26節の統合プログラミング学習帳（単一画面SPA）</div>
      </a>
      ${isGuide ? `
      <a class="card" href="${relPrefix}gakushucho.html#lesson_plan">
        <div class="tag" style="background:#fef3c7;color:#92400e;">指導案一括表示</div>
        <div class="card-title">📋 小・中・高全8章 詳細指導案一覧</div>
        <div class="card-desc">全8章26節の口頭メッセージ、観点別評価規準、授業フローを一覧表示</div>
      </a>` : ''}
    </div>
  </div>
</body>
</html>`;
  // 旧個別サブポータルの生成処理は撤去し、トップ統合ポータル index.html へ一元化
}

function buildLessonPlanHtml(sections, relPrefix = '') {
  const orderKeys = ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'];
  let lessonPlanHtml = '';
  orderKeys.forEach(k => {
    if (!sections[k]) return;
    const rawText = sections[k];
    const chMatch = k.match(/^ch0?(\d+)$/);
    if (!chMatch) return;
    const chNum = parseInt(chMatch[1], 10);

    const secParts = rawText.split(/(?=^## )/m);
    let secIdx = 0;

    secParts.forEach((part, index) => {
      if (!part.trim()) return;

      if (index > 0 || part.trim().startsWith('## ')) {
        secIdx++;
        const firstLine = part.trim().split('\n')[0];
        let secTitle = `第${chNum}章 第${secIdx}節`;
        const titleMatch = firstLine.match(/^## (.*$)/);
        if (titleMatch) {
          const cleanTitle = titleMatch[1].replace(/^[0-9]+-[0-9]+\.\s*/, '').trim();
          secTitle = `${chNum}-${secIdx}. ${cleanTitle}`;
        }

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
            lessonPlanHtml += `<div class="teacher-guide-annotation" style="margin-bottom:20px;">\n${parsed}\n</div>\n`;
          });
        }
      }
    });
  });
  return lessonPlanHtml;
}

const masterSections = parseMasterMd();

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
</head>
<body>
  <div class="top-bar">
    <div class="title">🚀 『ブロック学習帳』 統合ポータル</div>
    <div></div>
  </div>
  <div class="container">
    <h1>小・中・高対応 プログラミング・情報教材 『ブロック学習帳』</h1>
    <p style="font-size:1.05rem;line-height:1.7;color:#334155;margin-bottom:20px;">
      『ブロック学習帳』へようこそ！小学校の基礎から中学校技術科、高等学校「情報Ⅰ」まで、インストール不要・完全オフラインで安心してお使いいただける統合型プログラミング学習教材です。児童生徒が直感的に動かせるブロック操作から、共通テスト標準言語 (DNCL) や Python へのステップアップまでスムーズに接続します。
    </p>

    <!-- 🌟 最新のお知らせ・更新履歴インライン掲載 -->
    <div style="background:#fffbebf8;border:1px solid #fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <h3 style="margin:0;color:#92400e;font-size:1.05rem;display:flex;align-items:center;gap:6px;">
          <span>🌟 最新のお知らせ・更新履歴 (News)</span>
        </h3>
        <a href="gakushucho.html?teach=1#news" style="font-size:0.85rem;color:#b45309;font-weight:bold;text-decoration:underline;">詳細ページを見る ➔</a>
      </div>
      
      <!-- レスポンシブ スクロールコンテナ -->
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table style="width:100%;min-width:280px;border-collapse:collapse;font-size:0.875rem;background:white;border:1px solid #fed7aa;border-radius:6px;overflow:hidden;">
          <tr style="background:#fff7ed;border-bottom:1px solid #fed7aa;">
            <th style="padding:8px 12px;text-align:left;width:120px;">日付</th>
            <th style="padding:8px 12px;text-align:left;">区分</th>
          </tr>
          <tr style="border-bottom:1px solid #ffedd5;">
            <td style="padding:8px 12px;font-weight:bold;color:#1e293b;">2026/07/30</td>
            <td style="padding:8px 12px;font-weight:bold;color:#ea580c;">プロジェクト開始</td>
          </tr>
          <tr style="border-bottom:1px solid #ffedd5;">
            <td style="padding:8px 12px;color:#64748b;">2026/--/--</td>
            <td style="padding:8px 12px;font-weight:bold;color:#d97706;">クローズドβテスト開始</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;">2026/--/--</td>
            <td style="padding:8px 12px;font-weight:bold;color:#2563eb;">オープンβテスト開始</td>
          </tr>
        </table>
      </div>
      <p style="margin:8px 0 0 0;font-size:0.8rem;color:#b45309;line-height:1.5;">
        ※ 変更内容の詳細はオープンβテスト開始以降に記載します。
      </p>
    </div>

    <div style="background:#ffffff;border:2px solid var(--primary-color);padding:24px;border-radius:12px;margin:24px 0;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <h3 style="margin-top:0;color:var(--primary-color);display:flex;align-items:center;gap:8px;">
        <span>📦 オフライン設置用 一括配布パッケージ ＆ セットアップ手順</span>
      </h3>
      <p style="margin-bottom:16px;font-size:0.95rem;color:var(--text-color);">
        校内Webサーバーや端末のローカル環境へ導入・設置するための全ファイルを含むZIPパッケージです。
      </p>

      <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:16px;border-radius:8px;margin-bottom:16px;font-size:0.9rem;">
        <div style="font-weight:bold;margin-bottom:8px;color:#1e293b;">💡 簡単・安心の2ステップ設置手順：</div>
        <ol style="margin:0;padding-left:20px;line-height:1.7;">
          <li><strong>① 指導者用フォルダの準備:</strong> <code>指導者用</code> フォルダを作成し、<code>gakushucho.zip</code> を全解凍します（全指導案付きで起動）。</li>
          <li><strong>② 学習者用フォルダの準備:</strong> <code>学習者用</code> フォルダを作成して解凍後、<code>js/teach.js</code> を削除して生徒端末へ配付します（指導案完全非表示で安心起動）。</li>
        </ol>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <a href="gakushucho.zip" style="display:inline-flex;align-items:center;gap:6px;background:var(--primary-color);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
          <span>📦 gakushucho.zip をダウンロード</span>
        </a>
        <a href="gakushucho.html?teach=1#setup" style="display:inline-flex;align-items:center;gap:6px;background:#475569;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
          <span>📖 詳細な導入・セットアップガイドを見る</span>
        </a>
      </div>
    </div>

    <div class="card-grid" style="margin-top:24px;">
      <a class="card" href="gakushucho.html?teach=0">
        <div class="tag" style="background:#dbeafe;color:#1e40af;">学習者用</div>
        <div class="card-title">📘 ブロック学習帳</div>
        <div class="card-desc">小学校・中学校・高校生が直接ブロックを組み立てて直感的に学ぶ学習ツール（全8章26節）</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1">
        <div class="tag" style="background:#dcfce7;color:#166534;">指導者用</div>
        <div class="card-title">📗 指導用学習帳</div>
        <div class="card-desc">全8章の学習帳、指導者用解説、統合ガイドライン、詳細指導案を網羅した指導者用ツール</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1#setup">
        <div class="tag" style="background:#fef3c7;color:#92400e;">巻末付録①</div>
        <div class="card-title">📦 オフライン設置・端末別セットアップガイド</div>
        <div class="card-desc">非技術者の指導者でも迷わない、指導者用端末と学習者用端末（<code>js/teach.js</code> 削除）のセットアップ解説</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1#overview">
        <div class="tag" style="background:#e0e7ff;color:#3730a3;">巻末付録②</div>
        <div class="card-title">📖 教材概要 ＆ ガイドライン</div>
        <div class="card-desc">『ブロック学習帳』の指導理念、教材の特長、小中高のステップアップおよび活用方針</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1#news">
        <div class="tag" style="background:#fef3c7;color:#92400e;">巻末付録③</div>
        <div class="card-title">🌟 最新のお知らせ ＆ 更新履歴</div>
        <div class="card-desc">『ブロック学習帳』の公開用更新履歴および今後の開発・公開ロードマップ</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1#teacher_appendix">
        <div class="tag" style="background:#dcfce7;color:#166534;">巻末付録④</div>
        <div class="card-title">📎 観点別評価規準 ＆ 授業展開表</div>
        <div class="card-desc">小中高の学習指導要領に対応した観点別評価規準および標準的な授業展開モデル</div>
      </a>
      <a class="card" href="gakushucho.html?teach=1#lesson_plan">
        <div class="tag" style="background:#fef3c7;color:#92400e;">巻末付録⑤</div>
        <div class="card-title">📋 全8章 授業詳細指導案・評価規準一覧</div>
        <div class="card-desc">全8章26節の授業フロー、発問・口頭指導メッセージ、観点別評価規準を節ごとに掲載</div>
      </a>
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(rootDir, 'index.html'), portalHtml, 'utf-8');
console.log('  Generated: ' + path.relative(rootDir, path.join(rootDir, 'index.html')));

// files.txt 生成 (JSファイルの *.js.txt シンボリックリンク自動生成対応)
console.log('\n=== Generating URL-Based files.txt (Excluding files.txt & reports/) ===');
const baseUrl = 'https://gakushu.locker.jp/';
const fileList = [];

// js/ 配信フォルダ配下の *.js ファイルに対して *.js.txt シンボリックリンクを自動作成
function ensureJsTxtSymlinks(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      ensureJsTxtSymlinks(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const symlinkPath = fullPath + '.txt';
      if (!fs.existsSync(symlinkPath)) {
        try {
          fs.symlinkSync(entry.name, symlinkPath);
        } catch (e) {
          fs.copyFileSync(fullPath, symlinkPath);
        }
      }
    }
  }
}
const publicJsDir = path.join(rootDir, 'js');
ensureJsTxtSymlinks(publicJsDir);

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    // devel/ (非公開開発用資料)、reports/、old/、隠しファイル等を配信リストから除外
    if (relPath.startsWith('reports') || relPath.startsWith('devel') || relPath.startsWith('docs') || relPath === 'files.txt' || relPath === '.htaccess' || relPath.startsWith('old') || relPath.startsWith('.git') || relPath.startsWith('node_modules')) {
      continue;
    }

    // build/ ディレクトリ内処理: 非公開開発資料 build/devel/ は完全除外。スクリプト(build.js.txt, build_all.js.txt)と正本gakushucho.mdのみ掲載
    if (relPath.startsWith('build')) {
      if (relPath.startsWith('build/devel') || relPath.startsWith('build/docs')) {
        continue; // 非公開開発用資料 build/devel は完全除外
      }
      if (entry.isFile() && (entry.name === 'build.js' || entry.name === 'build_all.js')) {
        const symlinkPath = fullPath + '.txt';
        if (!fs.existsSync(symlinkPath)) {
          try { fs.symlinkSync(entry.name, symlinkPath); } catch (e) { fs.copyFileSync(fullPath, symlinkPath); }
        }
        fileList.push(baseUrl + (relPath + '.txt').replace(/\\/g, '/'));
      } else if (entry.isFile() && entry.name === 'gakushucho.md') {
        fileList.push(baseUrl + relPath.replace(/\\/g, '/'));
      }
      if (entry.isDirectory()) {
        collectFiles(fullPath);
      }
      continue;
    }

    // 生の *.js は AI クローラー互換のため除外（*.js.txt 側を登録）
    if (entry.isFile() && entry.name.endsWith('.js')) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(fullPath);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      fileList.push(baseUrl + relPath.replace(/\\/g, '/'));
    }
  }
}
collectFiles(rootDir);
const uniqueFileList = Array.from(new Set(fileList));
uniqueFileList.sort();

fs.writeFileSync(path.join(rootDir, 'files.txt'), uniqueFileList.join('\n'), 'utf-8');
console.log(`  Generated: files.txt (${uniqueFileList.length} URLs, base ${baseUrl}) [*.js.txt symlinks included]`);

// reports 生成
console.log('\n=== Writing Reports (reports/) ===');
const buildSummaryReport = `======================================================================
 『ブロック学習帳』 最新ビルド要約レポート
 Output Path: reports/build_summary.txt
 Date: 2026-08-05
======================================================================

1. パッケージ構成: ルート直下展開構成
   - 児童生徒用: learn/gakushucho.html
   - 教員指導者用: teach/gakushucho.html
   - 詳細指導案: teach/lesson_plan.html
   - 参考資料: docs/ref01〜ref05, changelog
   - 過去アーカイブ: old/index.html (旧 history.html)

2. 公開用一括配布パッケージ:
   - gakushucho.zip (動作に必要な全ファイルを内包、reports/ / files.txt / old/ 除外)
======================================================================
`;
fs.writeFileSync(path.join(reportsDir, 'build_summary.txt'), buildSummaryReport, 'utf-8');
console.log('  Generated: reports/build_summary.txt');

// gakushucho.zip 自動生成
console.log('\n=== Creating Public Package gakushucho.zip ===');
try {
  const zipPath = path.join(rootDir, 'gakushucho.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  // .htaccess, reports/, files.txt, gakushucho.zip, old/, .git/, node_modules/ を完全に除外してfiles.txtと同期
  const cmd = `cd ${rootDir} && zip -r gakushucho.zip . -x ".htaccess" ".*" "reports/*" "files.txt" "gakushucho.zip" "old/*" ".git/*" "node_modules/*"`;
  execSync(cmd);
  console.log('  Generated Public Package: gakushucho.zip (' + fs.statSync(zipPath).size + ' bytes)');
} catch (e) {
  console.error('Failed to create gakushucho.zip:', e);
}

console.log('\n=== Build completed successfully! ===\n');
