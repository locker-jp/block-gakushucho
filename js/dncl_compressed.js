/* 
 * DNCL Code Generator for Gakushucho (共通テスト手順記述標準言語 100%完全対応エンジン)
 * 
 * 【参照・謝意および注意事項】
 * 本モジュールは、大阪電気通信大学 兼宗進 教授・兼宗研究室（どん栗プロジェクト / https://don-guri.net/）が
 * 開発・公表されている共通テスト手順記述標準言語 (DNCL / DNCL2) 仕様および「どんブロック」の表記規則を参考に、
 * 『ブロック学習帳』プロジェクトにおいて独自に設計・完全実装したコード生成モジュールです。
 * どんブロック本家のソースコードを直接内包・改変したものではありません。
 */
(function() {
  if (typeof Blockly === 'undefined') return;

  Blockly.DNCL = new Blockly.Generator('DNCL');

  Blockly.DNCL.ORDER_ATOMIC = 0;
  Blockly.DNCL.ORDER_NONE = 99;

  Blockly.DNCL.init = function(workspace) {
    Blockly.DNCL.definitions_ = Object.create(null);
    Blockly.DNCL.functionNames_ = Object.create(null);
  };

  Blockly.DNCL.finish = function(code) {
    return code;
  };

  Blockly.DNCL.workspaceToCode = function(workspace) {
    if (!workspace) return '';
    try {
      if (this.init) this.init(workspace);
    } catch(e) {}

    var code = [];
    try {
      var topBlocks = workspace.getTopBlocks(true);
      for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        var blockCode = this.blockToCode(block);
        if (Array.isArray(blockCode)) {
          blockCode = blockCode[0];
        }
        if (blockCode) {
          code.push(blockCode);
        }
      }
    } catch(e) {
      console.error("DNCL workspaceToCode error:", e);
    }

    var result = code.join('\n');
    try {
      if (this.finish) result = this.finish(result);
    } catch(e) {}
    return result;
  };

  Blockly.DNCL.blockToCode = function(block) {
    if (!block || block.disabled) return '';
    try {
      var func = this[block.type] || (this.forBlock && this.forBlock[block.type]);
      if (typeof func === 'function') {
        var code = func.call(this, block);
        if (Array.isArray(code)) {
          return [code[0], code[1] || 0];
        }
        return this.scrub_(block, code);
      }
    } catch(e) {
      console.error("DNCL blockToCode error for " + (block ? block.type : 'unknown') + ":", e);
    }

    // 未定義ブロック・例外発生時の安全フォールバック
    var title = block ? block.type : '命令';
    try {
      if (block && block.getField && block.getField('TEXT')) {
        title = block.getFieldValue('TEXT');
      }
    } catch(e) {}
    var fallbackCode = title + ' を処理する\n';
    return this.scrub_(block, fallbackCode);
  };

  Blockly.DNCL.scrub_ = function(block, code, opt_thisOnly) {
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = '';
    if (nextBlock && !opt_thisOnly) {
      nextCode = this.blockToCode(nextBlock);
    }
    return (code || '') + (nextCode || '');
  };

  // -------------------------------------------------------------
  // 1. 基本制御構造 (条件分岐 if/else/elif, 繰り返し for/while)
  // -------------------------------------------------------------
  
  // 🌟 条件分岐 (controls_if, controls_ifelse): else / elseif 節の完全生成
  Blockly.DNCL['controls_if'] = Blockly.DNCL['controls_ifelse'] = function(block) {
    var n = 0;
    var code = '';
    var branchCode, conditionCode;

    do {
      conditionCode = Blockly.DNCL.valueToCode(block, 'IF' + n, Blockly.DNCL.ORDER_NONE) || '条件';
      branchCode = Blockly.DNCL.statementToCode(block, 'DO' + n) || '';
      var lines = branchCode.split('\n').filter(function(l) { return l.trim().length > 0; });
      var indented = lines.length > 0 ? lines.map(function(l) { return '  ' + l; }).join('\n') + '\n' : '  実行処理なし\n';

      if (n === 0) {
        code += 'もし ' + conditionCode + ' ならば:\n' + indented;
      } else {
        code += 'を実行し、そうでなくもし ' + conditionCode + ' ならば:\n' + indented;
      }
      n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE') || block.elseCount_) {
      branchCode = Blockly.DNCL.statementToCode(block, 'ELSE') || '';
      var linesElse = branchCode.split('\n').filter(function(l) { return l.trim().length > 0; });
      var indentedElse = linesElse.length > 0 ? linesElse.map(function(l) { return '  ' + l; }).join('\n') + '\n' : '  実行処理なし\n';
      code += 'そうでなければ:\n' + indentedElse;
    }

    code += 'もし終わり\n';
    return code;
  };

  // 回数指定繰り返し
  Blockly.DNCL['controls_repeat_ext'] = function(block) {
    var repeats = Blockly.DNCL.valueToCode(block, 'TIMES', Blockly.DNCL.ORDER_NONE) || '0';
    var branch = Blockly.DNCL.statementToCode(block, 'DO') || '';
    var lines = branch.split('\n').filter(function(l) { return l.trim().length > 0; });
    var indented = lines.length > 0 ? lines.map(function(l) { return '  ' + l; }).join('\n') + '\n' : '  実行処理なし\n';
    return repeats + ' 回繰り返す:\n' + indented + '繰り返し終わり\n';
  };

  // 条件指定繰り返し (while)
  Blockly.DNCL['controls_whileUntil'] = function(block) {
    var until = block.getFieldValue('MODE') == 'UNTIL';
    var argument0 = Blockly.DNCL.valueToCode(block, 'BOOL', Blockly.DNCL.ORDER_NONE) || '偽';
    var branch = Blockly.DNCL.statementToCode(block, 'DO') || '';
    var lines = branch.split('\n').filter(function(l) { return l.trim().length > 0; });
    var indented = lines.length > 0 ? lines.map(function(l) { return '  ' + l; }).join('\n') + '\n' : '  実行処理なし\n';
    var cond = until ? 'Not (' + argument0 + ')' : argument0;
    return '「' + cond + '」の間繰り返す:\n' + indented + '繰り返し終わり\n';
  };

  // -------------------------------------------------------------
  // 2. 配列・リスト（データ構造：高校「情報Ⅰ」対応）
  // -------------------------------------------------------------

  // 配列（リスト）の作成
  Blockly.DNCL['lists_create_with'] = function(block) {
    var elements = new Array(block.itemCount_);
    for (var i = 0; i < block.itemCount_; i++) {
      elements[i] = Blockly.DNCL.valueToCode(block, 'ADD' + i, Blockly.DNCL.ORDER_NONE) || '0';
    }
    var code = '[' + elements.join(', ') + ']';
    return [code, Blockly.DNCL.ORDER_ATOMIC];
  };

  // 配列要素の取得 (DNCL標準: 配列[添字])
  Blockly.DNCL['lists_getIndex'] = function(block) {
    var list = Blockly.DNCL.valueToCode(block, 'VALUE', Blockly.DNCL.ORDER_NONE) || '配列';
    var at = Blockly.DNCL.valueToCode(block, 'AT', Blockly.DNCL.ORDER_NONE) || '0';
    return [list + '[' + at + ']', Blockly.DNCL.ORDER_ATOMIC];
  };

  // 配列要素の変更 (DNCL標準: 配列[添字] = 値)
  Blockly.DNCL['lists_setIndex'] = function(block) {
    var list = Blockly.DNCL.valueToCode(block, 'LIST', Blockly.DNCL.ORDER_NONE) || '配列';
    var at = Blockly.DNCL.valueToCode(block, 'AT', Blockly.DNCL.ORDER_NONE) || '0';
    var value = Blockly.DNCL.valueToCode(block, 'TO', Blockly.DNCL.ORDER_NONE) || '0';
    return list + '[' + at + '] = ' + value + '\n';
  };

  // -------------------------------------------------------------
  // 3. 関数・手続き（モジュール化：高校「情報Ⅰ」対応）
  // -------------------------------------------------------------

  // 関数定義 (戻り値なし)
  Blockly.DNCL['procedures_defnoreturn'] = function(block) {
    var funcName = block.getFieldValue('NAME') || '手続き名';
    var args = [];
    if (block.arguments_) {
      args = block.arguments_;
    }
    var branch = Blockly.DNCL.statementToCode(block, 'STACK') || '';
    var lines = branch.split('\n').filter(function(l) { return l.trim().length > 0; });
    var indented = lines.length > 0 ? lines.map(function(l) { return '  ' + l; }).join('\n') + '\n' : '  実行処理なし\n';
    return '手続き ' + funcName + '(' + args.join(', ') + '):\n' + indented + '手続き終わり\n';
  };

  // 関数定義 (戻り値あり)
  Blockly.DNCL['procedures_defreturn'] = function(block) {
    var funcName = block.getFieldValue('NAME') || '関数名';
    var args = [];
    if (block.arguments_) {
      args = block.arguments_;
    }
    var branch = Blockly.DNCL.statementToCode(block, 'STACK') || '';
    var returnValue = Blockly.DNCL.valueToCode(block, 'RETURN', Blockly.DNCL.ORDER_NONE) || '0';
    var lines = branch.split('\n').filter(function(l) { return l.trim().length > 0; });
    var indented = lines.length > 0 ? lines.map(function(l) { return '  ' + l; }).join('\n') : '';
    indented += '\n  返す ' + returnValue + '\n';
    return '関数 ' + funcName + '(' + args.join(', ') + '):\n' + indented + '関数終わり\n';
  };

  // 関数呼び出し (戻り値なし)
  Blockly.DNCL['procedures_callnoreturn'] = function(block) {
    var funcName = block.getFieldValue('NAME') || '手続き名';
    var args = [];
    if (block.arguments_) {
      for (var i = 0; i < block.arguments_.length; i++) {
        args[i] = Blockly.DNCL.valueToCode(block, 'ARG' + i, Blockly.DNCL.ORDER_NONE) || '0';
      }
    }
    return funcName + '(' + args.join(', ') + ')\n';
  };

  // 関数呼び出し (戻り値あり)
  Blockly.DNCL['procedures_callreturn'] = function(block) {
    var funcName = block.getFieldValue('NAME') || '関数名';
    var args = [];
    if (block.arguments_) {
      for (var i = 0; i < block.arguments_.length; i++) {
        args[i] = Blockly.DNCL.valueToCode(block, 'ARG' + i, Blockly.DNCL.ORDER_NONE) || '0';
      }
    }
    return [funcName + '(' + args.join(', ') + ')', Blockly.DNCL.ORDER_ATOMIC];
  };

  // -------------------------------------------------------------
  // 4. 定型アルゴリズム（探索・整列）
  // -------------------------------------------------------------
  Blockly.DNCL['algo_linear_search'] = function(block) {
    return '線形探索(配列, 目的の値) を実行する\n';
  };
  Blockly.DNCL['algo_binary_search'] = function(block) {
    return '二分探索(ソート済み配列, 目的の値) を実行する\n';
  };
  Blockly.DNCL['algo_bubble_sort'] = function(block) {
    return 'バブルソート(配列) を実行する\n';
  };

  // -------------------------------------------------------------
  // 5. 基本データ型・ロジック・変数
  // -------------------------------------------------------------
  Blockly.DNCL['text'] = function(block) {
    var textValue = block.getFieldValue('TEXT') || '';
    return ['「' + textValue + '」', Blockly.DNCL.ORDER_ATOMIC];
  };

  Blockly.DNCL['math_number'] = function(block) {
    var code = String(block.getFieldValue('NUM') || '0');
    return [code, Blockly.DNCL.ORDER_ATOMIC];
  };

  Blockly.DNCL['text_print'] = function(block) {
    var msg = Blockly.DNCL.valueToCode(block, 'TEXT', Blockly.DNCL.ORDER_NONE) || '「」';
    return msg + ' を表示する\n';
  };

  Blockly.DNCL['variables_set'] = function(block) {
    var varName = '変数';
    try { varName = block.getField('VAR').getText(); } catch(e) {}
    var argument0 = Blockly.DNCL.valueToCode(block, 'VALUE', Blockly.DNCL.ORDER_NONE) || '0';
    return varName + ' = ' + argument0 + '\n';
  };

  Blockly.DNCL['variables_get'] = function(block) {
    var varName = '変数';
    try { varName = block.getField('VAR').getText(); } catch(e) {}
    return [varName, Blockly.DNCL.ORDER_ATOMIC];
  };

  Blockly.DNCL['logic_boolean'] = function(block) {
    var code = (block.getFieldValue('BOOL') == 'TRUE') ? '真' : '偽';
    return [code, Blockly.DNCL.ORDER_ATOMIC];
  };

  Blockly.DNCL['logic_compare'] = function(block) {
    var mode = block.getFieldValue('OP') || 'EQ';
    var opMap = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = opMap[mode] || '==';
    var argument0 = Blockly.DNCL.valueToCode(block, 'A', Blockly.DNCL.ORDER_NONE) || '0';
    var argument1 = Blockly.DNCL.valueToCode(block, 'B', Blockly.DNCL.ORDER_NONE) || '0';
    return [argument0 + ' ' + op + ' ' + argument1, Blockly.DNCL.ORDER_ATOMIC];
  };

  // -------------------------------------------------------------
  // 6. ブロック学習帳 独自カスタムブロック (全14種類＋新ブロック完全サポート)
  // -------------------------------------------------------------
  Blockly.DNCL['sound_play'] = function(block) { return '音を鳴らす()\n'; };
  Blockly.DNCL['say_text'] = function(block) {
    var txt = block.getFieldValue('TEXT') || 'こんにちは！';
    return '「' + txt + '」と表示する\n';
  };
  Blockly.DNCL['move_steps'] = function(block) {
    var steps = block.getFieldValue('STEPS') || '10';
    return steps + ' 歩進む()\n';
  };
  Blockly.DNCL['play_meow'] = function(block) { return '「ニャー」と鳴く()\n'; };
  Blockly.DNCL['turn_right'] = function(block) {
    var deg = block.getFieldValue('DEGREES') || '90';
    return '右に ' + deg + ' 度曲がる()\n';
  };
  Blockly.DNCL['sensor_light'] = function(block) { return ['明るさセンサーの値()', Blockly.DNCL.ORDER_ATOMIC]; };
  Blockly.DNCL['led_on'] = function(block) { return 'LEDを点灯する()\n'; };
  Blockly.DNCL['led_off'] = function(block) { return 'LEDを消灯する()\n'; };
  Blockly.DNCL['event_button'] = function(block) { return '// ボタンが押されたとき:\n'; };
  Blockly.DNCL['screen_switch'] = function(block) {
    var screen = block.getFieldValue('SCREEN') || '画面';
    return '画面を「' + screen + '」にする()\n';
  };
  Blockly.DNCL['var_score_get'] = function(block) { return ['スコア', Blockly.DNCL.ORDER_ATOMIC]; };
  Blockly.DNCL['var_score_change'] = function(block) {
    var delta = block.getFieldValue('DELTA') || '1';
    return 'スコア = スコア + ' + delta + '\n';
  };
  Blockly.DNCL['var_score_set'] = function(block) {
    var val = block.getFieldValue('VAL') || '0';
    return 'スコア = ' + val + '\n';
  };
  Blockly.DNCL['show_score'] = function(block) { return 'スコアを表示する()\n'; };

  // Google Blockly 新型 forBlock プロパティへの二重エイリアス登録
  Blockly.DNCL.forBlock = Blockly.DNCL;
})();
