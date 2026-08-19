# 『ブロック学習帳』 (Gakushucho) - プレβ版

『ブロック学習帳』は、小学校の基礎から中学校技術科「D 情報の技術」、高等学校「情報Ⅰ」まで対応した統合型プログラミング学習教材パッケージです。`gakushucho.zip` のダウンロードと展開にはネットワーク接続が必要ですが、展開後はブラウザで開くだけで動作し、授業中はオフラインでご利用いただけます。

---

## 📦 端末別セットアップ手順

`gakushucho.zip` を展開した直後に、まずこの手順に沿って指導者用・学習者用の2つのフォルダへ振り分けてください。

- **① 指導者用端末 (教員PC):** `gakushucho.zip` を全展開して配置（`gakushucho_teach.html` から全指導案・解説付きで起動）。
- **② 学習者用として配布する場合:** `gakushucho.zip` を展開後、`gakushucho_teach.html` ファイルを削除して配置（`gakushucho.html` のみが残り、指導案を含まない状態になります）。

詳しい手順（校内Webサーバーへの配置を含む）は、指導者用ファイル (`gakushucho_teach.html`) の巻末付録①をご覧ください。

---

## 📁 リポジトリ構造とディレクトリ役割

- **`index.html`** : 統合ポータル画面（「学習者用」および「指導者用」ツールへの入口、簡易セットアップ手順案内）
- **`gakushucho.html`** : 全{{CH}}章{{SEC}}節の学習者用単一HTML教材（指導案等の指導者向けコンテンツは含まない）
- **`gakushucho_teach.html`** : 上記に加えて指導者向けコンテンツ（指導案注釈・巻末付録）を含む指導者用単一HTML教材。巻末付録は付録A〜Kとして通し番号で採番されている（`gakushucho.html`にも共有されるのは付録A・Bのみ）。
  - `#appendix_a` : 付録A ブロック一覧リファレンス
  - `#appendix_b` : 付録B トラブルシューティング
  - `#appendix_c` : 付録C プロジェクトの理念・目的と教材構成の優先順位
  - `#appendix_d` : 付録D 教材の主な特長
  - `#appendix_e` : 付録E 📦 オフライン設置・端末別セットアップガイド
  - `#appendix_f` : 付録F 💾 プログラムの保存・提出・復元について
  - `#appendix_g` : 付録G 📅 更新履歴
  - `#appendix_h` : 付録H 文部科学省A〜F分類の定義と解説
  - `#appendix_i` : 付録I 口頭・紙ノート・カード・Scratch等との併用方針
  - `#appendix_j` : 付録J 学習指導要領対応表
  - `#appendix_k` : 付録K 印刷用ワークシート全8種ライブラリ
- **`worksheets/`** : A4用紙印刷対応の印刷用ワークシート全8種ライブラリ (単体閲覧・配布・模範回答ありなし切換表示対応)
- **`build/`** : 正本マスターソース (`build/gakushucho.md`, `build/README.md`) および自動コンパイルビルドスクリプト (`build.js`, `build_all.js`)

---

## 🛠️ 一括コンパイルビルド方法

本パッケージは、`build/gakushucho.md` (正本Markdown) からすべてのHTMLおよび配布用パッケージ (`gakushucho.zip`) を一括自動生成します。このREADME.md自体も `build/README.md` から自動生成されるため、直接編集せず `build/README.md` を編集してください。

```bash
node build/build_all.js
```

---

## 📜 ライセンス表記 (LICENSE)

本ソフトウェアは **The MIT License** のもとで公開されています。詳細は [`LICENSE`](./LICENSE) をご参照ください。  
サードパーティコンポーネント (Google Blockly: Apache 2.0) の権利表記は [`NOTICE`](./NOTICE) をご参照ください。
