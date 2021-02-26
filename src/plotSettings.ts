import { loadPlotSettingsFromStorage, savePlotSettingsToStorage } from './storage';
import { graphState } from './graph';
import { seekAnimation } from './animation';

export class PlotSettingsControl {
  static plotSettings: PlotSettings;
  static init() {
    this.plotSettings = loadPlotSettingsFromStorage();
  }
  static parseJSON(json: string | null) {
    return new PlotSettings(JSON.parse(json ?? '{}'));
  }
  static saveToWebStorage() {
    savePlotSettingsToStorage(this.plotSettings);
  }
  static timeStop() {
    graphState.animatable = !this.plotSettings.animate;
  }
  static seek() {
    //if(plotSettings.animate)
    seekAnimation(this.plotSettings.seek);
  }
}

/** 描画設定用のデータ構造 */
export class PlotSettings {
  plotInterval: number;
  backgroundColor: string;
  lineWidth: number;
  scaleLabelVisible: boolean;
  twoDimensional: boolean;
  autoRotate: boolean;
  dynamicDraw: boolean;
  animate: boolean;
  seek: number;
  parameterCondition: Map<string, ParameterCondition> | undefined;
  parameterConditionSeek: ParameterConditionSeek | undefined;
  constructor(obj: any) {
    this.plotInterval = obj?.plotInterval ?? 0.1;
    this.backgroundColor = obj?.backgroundColor ?? '#000000';
    this.lineWidth = obj?.lineWidth ?? 1;
    this.scaleLabelVisible = obj?.scaleLabelVisible ?? true;
    this.twoDimensional = obj?.twoDimensional ?? false;
    this.autoRotate = obj?.autoRotate ?? false;
    this.dynamicDraw = obj?.dynamicDraw ?? false;
    this.animate = obj?.animate ?? false;
    this.seek = obj?.seek ?? 0;
  }
}

export class ParameterCondition {
  fixed: boolean;
  range: boolean;
  value: number;
  minValue: number;
  maxValue: number;

  constructor(minParValue: number, maxParValue: number) {
    this.fixed = true;
    this.range = false;
    this.value = (minParValue + maxParValue) / 2;
    this.minValue = minParValue;
    this.maxValue = maxParValue;
  }
}

export class ParameterConditionSeek {
  stop: boolean;
  value: number;
  minValue: number;
  maxValue: number;
  constructor(minParValue: number, maxParValue: number) {
    this.stop = false;
    this.value = (minParValue + maxParValue) / 2;
    this.minValue = minParValue;
    this.maxValue = maxParValue;
  }
}
