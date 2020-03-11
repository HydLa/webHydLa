export class PlotSettings {
  plotInterval: number;
  backgroundColor: string;
  lineWidth: number;
  scaleLabelVisible: boolean;
  twoDimensional: boolean;
  autoRotate: boolean;
  animate: boolean;
  seek: number;
  parameter_condition: { [key: string]: ParameterCondition };
  parameter_condition_seek: ParameterConditionSeek;
  constructor(obj: any) {
    this.plotInterval = obj?.plotInterval ?? 0.1;
    this.backgroundColor = obj?.backgroundColor ?? "#000000";
    this.lineWidth = obj?.lineWidth ?? 1;
    this.scaleLabelVisible = obj?.scaleLabelVisible ?? true;
    this.twoDimensional = obj?.twoDimensional ?? false;
    this.autoRotate = obj?.autoRotate ?? false;
    this.animate = obj?.animate ?? false;
    this.seek = obj?.seek ?? 0;
  }
  static parseJSON(json: string) {
    return new PlotSettings(JSON.parse(json));
  }
}

class ParameterCondition {
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

class ParameterConditionSeek {
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