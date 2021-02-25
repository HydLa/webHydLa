import * as dat from 'dat.gui';
import { graphControl, updateRotate, update2DMode, replotAll } from './graph_control';
import { PlotSettings, PlotSettingsControl, ParameterCondition, ParameterConditionSeek } from './plot_settings';
import { addNewLine } from './plot_line_map_control';
import { HydatParameter, HydatParameterPoint } from './hydat';
import { seekAnimation } from './animation_control';
import { setBackgroundColor, update_axes } from './plot_control';

/** 描画用設定の処理を行う */
export class DatGUIState {
  static parameterFolder: dat.GUI;
  static variableFolder: dat.GUI;
  static parameterFolderSeek: dat.GUI;

  static parameterItems: dat.GUIController[] = [];
  static parameterItemsSeek: dat.GUIController[] = [];

  static plotSettings: PlotSettings;
}

export function initDatGUIState(plotSettings: PlotSettings) {
  DatGUIState.plotSettings = plotSettings;
  const addLineObj = {
    add: function () {
      const line = addNewLine('', '', '');
      line.folder.open();
    },
  };
  const datGui = new dat.GUI({ autoPlace: false, load: localStorage });
  const datGuiAnimate = new dat.GUI({ autoPlace: false, load: localStorage });
  datGui
    .add(plotSettings, 'plotInterval', 0.01, 1)
    .step(0.001)
    .name('plot interval')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .add(plotSettings, 'lineWidth', 1, 10)
    .step(1)
    .name('line width')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .add(plotSettings, 'scaleLabelVisible')
    .name('show scale label')
    .onChange(() => {
      update_axes(true);
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .add(plotSettings, 'twoDimensional')
    .name('XY-mode')
    .onChange(() => {
      update2DMode(plotSettings.twoDimensional);
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .add(plotSettings, 'autoRotate')
    .name('auto rotate')
    .onChange(() => {
      updateRotate(plotSettings.autoRotate);
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .add(plotSettings, 'dynamicDraw')
    .name('dynamic draw')
    .onChange(() => {
      replotAll();
      PlotSettingsControl.saveToWebStorage();
    });
  datGui
    .addColor(plotSettings, 'backgroundColor')
    .name('background')
    .onChange((value) => {
      setBackgroundColor(value);
      PlotSettingsControl.saveToWebStorage(); /*render_three_js();i*/
    });
  datGuiAnimate
    .add(plotSettings, 'animate')
    .name('stop')
    .onChange(() => {
      PlotSettingsControl.time_stop();
      PlotSettingsControl.saveToWebStorage();
    });

  datGui.domElement.style.zIndex = '2';
  datGuiAnimate.domElement.style.zIndex = '3';
  datGuiAnimate.domElement.style['position'] = 'absolute';
  datGuiAnimate.domElement.style['bottom'] = '50px';

  const heightArea = $('#graph-area').css('height');

  DatGUIState.parameterFolder = datGui.addFolder('parameters');
  DatGUIState.parameterFolderSeek = datGuiAnimate.addFolder('seek');
  datGui.add(addLineObj, 'add').name('add new line');
  DatGUIState.variableFolder = datGui.addFolder('variables');

  const datContainer = document.getElementById('dat-gui')!;
  datContainer.appendChild(datGui.domElement);

  const datContainerB = document.getElementById('dat-gui-bottom')!;
  datContainerB.style.height = heightArea;
  datContainerB.appendChild(datGuiAnimate.domElement);

  const ndModeCheckBox = <HTMLInputElement>document.getElementById('nd_mode_check_box');
  ndModeCheckBox.checked = true;

  fixLayout();
}

export function parameterSetting(pars: Map<string, HydatParameter>) {
  for (const item of DatGUIState.parameterItems) {
    DatGUIState.parameterFolder.remove(item);
  }
  DatGUIState.parameterItems = [];
  DatGUIState.plotSettings.parameter_condition = new Map();
  for (const [key, par] of pars) {
    if (par instanceof HydatParameterPoint) return;

    const lower = par.lower_bound.value.getValue(new Map());
    const upper = par.upper_bound.value.getValue(new Map());
    if (!isFinite(lower) && !isFinite(upper)) {
      throw new Error('Error: at least one of lower_bound and upper_bound must be finite.');
    }

    const minParValue = isFinite(lower) ? lower : upper - 100;
    const maxParValue = isFinite(upper) ? upper : lower + 100;
    const step = (maxParValue - minParValue) / 100;

    DatGUIState.plotSettings.parameter_condition.set(key, new ParameterCondition(minParValue, maxParValue));

    const parameterItem = DatGUIState.parameterFolder
      .add(DatGUIState.plotSettings.parameter_condition.get(key)!, 'value', minParValue, maxParValue)
      .name(key);
    parameterItem.onChange(() => {
      replotAll();
    });
    parameterItem.step(step);

    const modeItem = DatGUIState.parameterFolder.add(DatGUIState.plotSettings.parameter_condition.get(key)!, 'fixed');
    const modeItemRange = DatGUIState.parameterFolder.add(
      DatGUIState.plotSettings.parameter_condition.get(key)!,
      'range'
    );
    DatGUIState.parameterItems.push(modeItem);
    DatGUIState.parameterItems.push(modeItemRange);
    DatGUIState.parameterItems.push(parameterItem);

    modeItem.onChange(function () {
      if (!DatGUIState.plotSettings.parameter_condition!.get(key)!.fixed) {
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
    modeItemRange.onChange(() => {
      graphControl.range_mode = DatGUIState.plotSettings.parameter_condition!.get(key)!.range;
    });
  }

  if (pars.size > 0) DatGUIState.parameterFolder.open();
  else DatGUIState.parameterFolder.close();

  fixLayout();
}

export function parameterSeekSetting(lineLen: number) {
  for (const item of DatGUIState.parameterItemsSeek) {
    DatGUIState.parameterFolderSeek.remove(item);
  }
  DatGUIState.parameterItemsSeek = [];
  const minParValue = 0;
  const maxParValue = lineLen - 1;
  const step = 1;

  DatGUIState.plotSettings.parameter_condition_seek = new ParameterConditionSeek(minParValue, maxParValue);

  const parameterItemSeek = DatGUIState.parameterFolderSeek.add(
    DatGUIState.plotSettings.parameter_condition_seek,
    'value',
    minParValue,
    maxParValue
  );
  parameterItemSeek.onChange(() => {
    seekAnimation(DatGUIState.plotSettings.parameter_condition_seek!.value);
  });
  parameterItemSeek.step(step);

  DatGUIState.parameterItemsSeek.push(parameterItemSeek);

  DatGUIState.parameterFolderSeek.open();

  fixLayout();
}

export function parameterSeekSettingAnimate(lineLen: number, timeLine: number) {
  for (const item of DatGUIState.parameterItemsSeek) {
    DatGUIState.parameterFolderSeek.remove(item);
  }
  DatGUIState.parameterItemsSeek = [];
  const minParValue = 0;
  const maxParValue = lineLen;
  const step = 1;

  DatGUIState.plotSettings.parameter_condition_seek = new ParameterConditionSeek(minParValue, maxParValue);

  const parameter_item_seek = DatGUIState.parameterFolderSeek.add(
    DatGUIState.plotSettings.parameter_condition_seek,
    'value',
    minParValue,
    maxParValue
  );
  parameter_item_seek.onChange(() => {
    seekAnimation(DatGUIState.plotSettings.parameter_condition_seek!.value);
  });
  parameter_item_seek.step(step);

  DatGUIState.parameterItemsSeek.push(parameter_item_seek);

  parameter_item_seek.min(minParValue).max(maxParValue).step(step).setValue(timeLine);

  DatGUIState.parameterFolderSeek.open();

  fixLayout();
}

export function fixLayout() {
  // to avoid layout collapsion of dat gui
  const dgCInputs = $('.dg .c input[type=text]');
  for (const input of dgCInputs) {
    input.style.height = '100%';
  }

  const selectors = $('.selector');
  for (const selector of selectors) {
    selector.style.width = '100%';
  }
}
