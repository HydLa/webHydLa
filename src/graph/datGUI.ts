import * as dat from 'dat.gui';
import { graphState, updateRotate, update2DMode, replotAll } from './graph';
import { PlotSettings, PlotSettingsControl, ParameterCondition, ParameterConditionSeek } from './plotSettings';
import { addNewLine } from './plotLineMap';
import { seekAnimation, removeRanges, makeRanges } from './animation';
import { setBackgroundColor, updateAxes } from './plot';
import { HydatParameter, HydatParameterPoint } from '../hydat/hydat';

/** 描画用設定の処理を行う(左側のパネル) */
export class DatGUIState {
  /** parametersのフォルダ */
  static parameterFolder: dat.GUI;
  /** variablesのフォルダ */
  static variableFolder: dat.GUI;
  /** seekのフォルダ */
  static parameterFolderSeek: dat.GUI;

  /** parametersフォルダに追加されていくパラメタ群 */
  static parameterItems: dat.GUIController[] = [];
  /** valueパネル */
  static parameterItemsSeek: dat.GUIController[] = [];

  /** 描画設定用のデータ構造 */
  static plotSettings: PlotSettings;
}

/**
 * 左側のパネルの初期化
 * @param plotSettings 描画設定用のデータ構造
 */
export function initDatGUIState(plotSettings: PlotSettings) {
  DatGUIState.plotSettings = plotSettings;
  // add new line
  const addLineObj = {
    add: function () {
      const line = addNewLine('', '', '');
      line.folder.open();
    },
  };
  const datGUI = new dat.GUI({ autoPlace: false, load: localStorage }); // webHydLaの左側全体
  const datGUIAnimate = new dat.GUI({ autoPlace: false, load: localStorage });
  datGUI
    .add(plotSettings, 'plotInterval', 0.01, 1)
    .step(0.001) // 数値がこの値で変動できる
    .name('plot interval')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .add(plotSettings, 'lineWidth', 1, 10)
    .step(1)
    .name('line width')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .add(plotSettings, 'scaleLabelVisible')
    .name('show scale label')
    .onChange(() => {
      updateAxes(true);
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .add(plotSettings, 'twoDimensional')
    .name('XY-mode')
    .onChange(() => {
      update2DMode(plotSettings.twoDimensional);
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .add(plotSettings, 'autoRotate')
    .name('auto rotate')
    .onChange(() => {
      updateRotate(plotSettings.autoRotate);
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .add(plotSettings, 'dynamicDraw')
    .name('dynamic draw')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGUI
    .addColor(plotSettings, 'backgroundColor')
    .name('background')
    .setValue('#101010')
    .onChange((value) => {
      setBackgroundColor(value);
      PlotSettingsControl.saveToWebStorage(); /*renderThreeJs();i*/
    });
  datGUIAnimate
    .add(plotSettings, 'animate')
    .name('stop')
    .onChange(() => {
      PlotSettingsControl.timeStop();
      PlotSettingsControl.saveToWebStorage();
    });

  // ブラウザを縮めた時にどちらが上にくるか
  datGUI.domElement.style.zIndex = '2';
  datGUIAnimate.domElement.style.zIndex = '3';
  datGUIAnimate.domElement.style['position'] = 'absolute';
  datGUIAnimate.domElement.style['bottom'] = '50px';

  const heightArea = $('#graph-area').css('height');

  // フォルダの追加
  DatGUIState.parameterFolder = datGUI.addFolder('parameters');
  DatGUIState.parameterFolderSeek = datGUIAnimate.addFolder('seek');
  datGUI.add(addLineObj, 'add').name('add new line');
  DatGUIState.variableFolder = datGUI.addFolder('variables');

  // 上
  const datContainer = document.getElementById('dat-gui')!;
  datContainer.appendChild(datGUI.domElement);

  // 下
  const datContainerB = document.getElementById('dat-gui-bottom')!;
  datContainerB.style.height = heightArea;
  datContainerB.appendChild(datGUIAnimate.domElement);

  fixLayout();
}

/**
 * 
 * @param pars パラメタ群
 * @returns 
 */
export function parameterSetting(pars: Map<string, HydatParameter>) {
  for (const item of DatGUIState.parameterItems) {
    DatGUIState.parameterFolder.remove(item);
  }
  DatGUIState.parameterItems = [];
  DatGUIState.plotSettings.parameterCondition = new Map();
  for (const [key, par] of pars) {
    // returnじゃなくてcontinue?
    if (par instanceof HydatParameterPoint) return;

    // パラメタの下限と上限
    const lower = par.lowerBound.value.getValue(new Map());
    const upper = par.upperBound.value.getValue(new Map());

    // パラメタの下限と上限の少なくとも1つは有限な値であること
    if (!isFinite(lower) && !isFinite(upper)) {
      throw new Error('Error: at least one of lowerBound and upperBound must be finite.');
    }

    // 下限値が有限でなければ, 上限値-100を下限値とする(上限値も然り)
    const minParValue = isFinite(lower) ? lower : upper - 100;
    const maxParValue = isFinite(upper) ? upper : lower + 100;
    const step = (maxParValue - minParValue) / 100;

    DatGUIState.plotSettings.parameterCondition.set(key, new ParameterCondition(minParValue, maxParValue));

    const parameterItem = DatGUIState.parameterFolder
      .add(DatGUIState.plotSettings.parameterCondition.get(key)!, 'value', minParValue, maxParValue)
      .name(key);
    parameterItem.onChange(() => {
      replotAll();
    });
    parameterItem.step(step);

    const modeItemFixed = DatGUIState.parameterFolder.add(DatGUIState.plotSettings.parameterCondition.get(key)!, 'fixed');
    const modeItemRange = DatGUIState.parameterFolder.add(
      DatGUIState.plotSettings.parameterCondition.get(key)!,
      'range'
    );
    DatGUIState.parameterItems.push(modeItemFixed);
    DatGUIState.parameterItems.push(modeItemRange);
    DatGUIState.parameterItems.push(parameterItem);

    // パラメタのfixedのチェックボックス
    modeItemFixed.onChange(() => {
      if (!DatGUIState.plotSettings.parameterCondition!.get(key)!.fixed) {
        parameterItem.min(1).max(100).step(1).setValue(5);
      } else {
        parameterItem
          .min(minParValue)
          .max(maxParValue)
          .step(step)
          .setValue((minParValue + maxParValue) / 2);
      }
      replotAll();
    });
    // パラメタのrangeのチェックボックス
    modeItemRange.onChange(() => {
      graphState.rangeMode = DatGUIState.plotSettings.parameterCondition!.get(key)!.range;
      if (graphState.rangeMode) {
        makeRanges();
      } else {
        removeRanges();
      }
    });
  }

  // パラメタがあるならparametersフォルダを開いて表示, ないなら閉じておく
  if (pars.size > 0) DatGUIState.parameterFolder.open();
  else DatGUIState.parameterFolder.close();

  fixLayout();
}

/**
 * valueパネルのシークバーの設定
 * @param lineLen tの100分の1を1とした数値？
 */
export function parameterSeekSetting(lineLen: number) {
  for (const item of DatGUIState.parameterItemsSeek) {
    DatGUIState.parameterFolderSeek.remove(item);
  }
  DatGUIState.parameterItemsSeek = [];
  const minParValue = 0;
  const maxParValue = lineLen - 1;
  const step = 1;

  DatGUIState.plotSettings.parameterConditionSeek = new ParameterConditionSeek(minParValue, maxParValue);

  // seekフォルダにvalueパネルを追加
  const parameterItemSeek = DatGUIState.parameterFolderSeek.add(
    DatGUIState.plotSettings.parameterConditionSeek,
    'value',
    minParValue,
    maxParValue
  );
  // クリックした時点に飛ぶ
  parameterItemSeek.onChange(() => {
    seekAnimation(DatGUIState.plotSettings.parameterConditionSeek!.value);
  });
  parameterItemSeek.step(step);

  DatGUIState.parameterItemsSeek.push(parameterItemSeek);

  DatGUIState.parameterFolderSeek.open();

  fixLayout();
}
/**
 * parameterSeekSettingの引数が1つ増えたやつ(目的は謎)
 * @param lineLen tの100分の1を1とした数値？
 * @param timeLine tの100分の1を1とした数値？
 */
export function parameterSeekSettingAnimate(lineLen: number, timeLine: number) {
  for (const item of DatGUIState.parameterItemsSeek) {
    DatGUIState.parameterFolderSeek.remove(item);
  }
  DatGUIState.parameterItemsSeek = [];
  const minParValue = 0;
  const maxParValue = lineLen;
  const step = 1;

  DatGUIState.plotSettings.parameterConditionSeek = new ParameterConditionSeek(minParValue, maxParValue);

  const parameterItemSeek = DatGUIState.parameterFolderSeek.add(
    DatGUIState.plotSettings.parameterConditionSeek,
    'value',
    minParValue,
    maxParValue
  );
  parameterItemSeek.onChange(() => {
    seekAnimation(DatGUIState.plotSettings.parameterConditionSeek!.value);
  });
  parameterItemSeek.step(step);

  DatGUIState.parameterItemsSeek.push(parameterItemSeek);

  parameterItemSeek.min(minParValue).max(maxParValue).step(step).setValue(timeLine);

  DatGUIState.parameterFolderSeek.open();

  fixLayout();
}

/** to avoid layout collapsion of dat gui */
export function fixLayout() {
  // 数値入力部分の高さ調整
  const dgCInputs = $('.dg .c input[type=text]');
  for (const input of dgCInputs) {
    input.style.height = '100%';
  }

  // グラフエリアの色のセレクター（四角形のやつ）
  const selectors = $('.selector');
  for (const selector of selectors) {
    selector.style.width = '100%';
  }
}
