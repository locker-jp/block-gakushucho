# 『ブロック学習帳』 ライセンスおよび第三者ソフトウェア情報 (LICENSE)

本ソフトウェアおよびパッケージ『ブロック学習帳』(Gakushucho) は、オープンソースソフトウェアです。  
本リポジトリおよび配信パッケージに含まれる構成要素は、以下のライセンス条件に従って配布されています。

---

## 1. 『ブロック学習帳』 本体のライセンス (The MIT License)

**Copyright (c) 2026 Locker.JP**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 2. Google Blockly モジュール (Third-Party Component)

- **コンポーネント名:** Google Blockly
- **公式配布サイト:** Google Developers / GitHub (google/blockly)
- **公式URL:** [https://developers.google.com/blockly](https://developers.google.com/blockly) / [https://github.com/google/blockly](https://github.com/google/blockly)
- **入手バージョン:** Google Blockly Core v9.x / v10.x 相当
- **内包ファイル:**
  - `js/blockly_compressed.js`
  - `js/blocks_compressed.js`
  - `js/javascript_compressed.js`
  - `js/python_compressed.js`
  - `js/msg/js/ja.js`
- **改変の有無:** なし (Google公式リリースビルドをそのままローカルに配置内包)
- **ライセンス:** Apache License 2.0

**Copyright 2012 Google LLC**

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## 3. DNCL言語仕様および「どんブロック」表記法への参照 (Specification Reference)

- **参照仕様・表記名:** 共通テスト手順記述標準言語 (DNCL / DNCL2) 仕様および「どんブロック (DON-BLOCK)」変換表記法
- **仕様開発元・著者:** 大阪電気通信大学 兼宗進 教授・兼宗研究室（どん栗プロジェクト / DON-BLOCK）
- **公式サイト・一次情報源:** どん栗プロジェクト [https://don-guri.net/](https://don-guri.net/)
- **該当ファイル:** `js/dncl_compressed.js`
- **実装の態様と著作権に関する注意事項:**  
  `js/dncl_compressed.js` は、どんブロック本家のソースコードを直接コピー・改変して内包したものではなく、大阪電気通信大学 兼宗進 教授・兼宗研究室（どん栗プロジェクト）が公表されている公式DNCL文法・表記仕様を参考に、『ブロック学習帳』開発プロジェクトにおいて**完全独自に設計・実装したDNCLコード生成モジュール**です。先方開発元への誤解やご迷惑を回避するため、ここに仕様の出典および深甚なる謝意を明記いたします。

**Copyright (c) Susumu Kanemune et al. / 大阪電気通信大学 どん栗プロジェクト (DNCL Specification Reference)**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
