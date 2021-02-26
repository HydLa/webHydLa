import { StorageControl } from './storage_control';
import { graphControl } from './graph_control';
import { seekAnimation } from './animation_control';

export class PlotSettingsControl {
  static plot_settings: PlotSettings;
  static init() {
    this.plot_settings = StorageControl.loadPlotSettings();
  }
  static parseJSON(json: string | null) {
    return new PlotSettings(JSON.parse(json ?? '{}'));
  }
  static saveToWebStorage() {
    StorageControl.savePlotSettings(this.plot_settings);
  }
  static time_stop() {
    graphControl.animatable = !this.plot_settings.animate;
  }
  static seek() {
    //if(plot_settings.animate)
    seekAnimation(this.plot_settings.seek);
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
  parameter_condition: { [key: string]: ParameterCondition } | undefined;
  parameter_condition_seek: ParameterConditionSeek | undefined;
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
  min_value: number;
  max_value: number;

  constructor(min_par_value: number, max_par_value: number) {
    this.fixed = true;
    this.range = false;
    this.value = (min_par_value + max_par_value) / 2;
    this.min_value = min_par_value;
    this.max_value = max_par_value;
  }
}

export class ParameterConditionSeek {
  stop: boolean;
  value: number;
  min_value: number;
  max_value: number;
  constructor(min_par_value: number, max_par_value: number) {
    this.stop = false;
    this.value = (min_par_value + max_par_value) / 2;
    this.min_value = min_par_value;
    this.max_value = max_par_value;
  }
}
