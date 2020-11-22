import { Construct, Constant, Plus } from "./parse";

const isHydatParameterPointRaw = (raw: HydatParameterRaw): raw is HydatParameterPointRaw => {
  return (raw as HydatParameterPointRaw).unique_value !== undefined;
}

const isHydatParameterIntervalRaw = (raw: HydatParameterRaw): raw is HydatParameterIntervalRaw => {
  return (raw as HydatParameterIntervalRaw).lower_bounds !== undefined;
}

const isHydatTimePPRaw = (raw: HydatTimeRaw): raw is HydatTimePPRaw => {
  return (raw as HydatTimePPRaw).time_point !== undefined;
}

const translate_parameter_map = (parameter_map: { [key: string]: HydatParameterRaw }) => {
  const map: { [key: string]: HydatParameter } = {};
  for (const key in parameter_map) {
    const p = parameter_map[key];
    if (isHydatParameterPointRaw(p)) {
      map[key] = new HydatParameterPoint(p.unique_value);
    } else if (isHydatParameterIntervalRaw(p)) {
      map[key] = new HydatParameterInterval(p.lower_bounds, p.upper_bounds);
    } else {
      map[key] = new HydatParameterInterval([p.lower_bound],[p.upper_bound]);
    }
  }
  return map;
}

export class HydatException extends Error {
  constructor(message: string) {
    super();
    Object.defineProperty(this, 'name', {
      get: () => this.constructor.name,
    });
    Object.defineProperty(this, 'message', {
      get: () => message,
    });
  }
}

export class Hydat {
  name: string;
  first_phases: HydatPhase[];
  parameters: { [key: string]: HydatParameter };
  variables: string[];
  raw: HydatRaw;

  constructor(hydat: HydatRaw) {
    this.raw = hydat;
    this.name = hydat.name;
    this.variables = hydat.variables;
    this.first_phases = [];
    for (const ph of hydat.first_phases) {
      this.first_phases.push(new HydatPhase(ph));
    }
    this.parameters = translate_parameter_map(hydat.parameters);
  }
}

export interface HydatRaw {
  name: string;
  first_phases: HydatPhaseRaw[];
  parameters: { [key: string]: HydatParameterRaw };
  variables: string[];
}

export class HydatPhase {
  type: "PP" | "IP";
  time: HydatTime;
  variable_map: { [key: string]: Construct };
  parameter_maps: { [key: string]: HydatParameter }[];
  children: HydatPhase[];
  simulation_state: string;

  constructor(phase: HydatPhaseRaw) {
    this.simulation_state = phase.simulation_state;
    if (isHydatTimePPRaw(phase.time)) { // phase.type === "PP"
      this.type = "PP"
      this.time = new HydatTimePP(phase.time.time_point);
    } else {
      this.type = "IP"
      this.time = new HydatTimeIP(phase.time.start_time, phase.time.end_time);
    }

    this.variable_map = {};
    for (const key in phase.variable_map) {
      if (phase.variable_map[key].unique_value === undefined) {
        throw new HydatException(`webHydLa doesn't support ununique value in variable maps for ${key}`);
      }
      this.variable_map[key] = Construct.parse(phase.variable_map[key].unique_value/*, phase.variable_map*/);
    }

    this.parameter_maps = [];
    for (const map of phase.parameter_maps) {
      this.parameter_maps.push(translate_parameter_map(map));
    }

    this.children = [];
    for (const c of phase.children) {
      this.children.push(new HydatPhase(c));
    }
  }
}

interface HydatPhaseRaw {
  type: string
  time: HydatTimeRaw;
  variable_map: { [key: string]: HydatVariableRaw };
  parameter_maps: { [key: string]: HydatParameterRaw }[];
  children: HydatPhaseRaw[];
  simulation_state: string;
}

export type HydatParameter = HydatParameterPoint | HydatParameterInterval;
export class HydatParameterPoint {
  unique_value: Construct;

  constructor(unique_value: string) {
    this.unique_value = Construct.parse(unique_value);
  }
}

// Hydatのlower_bounds/upper_boundsは歴史的理由から配列となっているが、要素数は必ず1個以下である
type Bound = {value: Construct};

export class HydatParameterInterval {
  lower_bound: Bound;
  upper_bound: Bound;

  constructor(lower_bounds: { value: string }[], upper_bounds: { value: string }[]) {
    switch (lower_bounds.length){
      case 0:
        this.lower_bound = { value: new Constant(-Infinity)};
        break;
      case 1:
        this.lower_bound = { value: Construct.parse(lower_bounds[0].value)};
        break;
      default:
        throw new Error(`Error: lower_bounds.length must be 0 or 1, but got ${lower_bounds.length}.`);
    }

    switch (upper_bounds.length){
      case 0:
        this.upper_bound = { value: new Constant(Infinity)};
        break;
      case 1:
        this.upper_bound = { value: Construct.parse(upper_bounds[0].value)};
        break;
      default:
        throw new Error(`Error: upper_bounds.length must be 0 or 1, but got ${upper_bounds.length}.`);
    }
  }
}

type HydatParameterRaw = HydatParameterPointRaw | HydatParameterIntervalRaw | HydatParameterIntervalRaw2;

interface HydatParameterPointRaw {
  unique_value: string;
}

interface HydatParameterIntervalRaw {
  lower_bounds: { value: string }[];
  upper_bounds: { value: string }[];
}

interface HydatParameterIntervalRaw2 {
  lower_bound: { value: string };
  upper_bound: { value: string };
}

type HydatTime = HydatTimePP | HydatTimeIP;

export class HydatTimePP {
  time_point: Construct;
  constructor(time_point: string) {
    this.time_point = Construct.parse(time_point);
  }
}

class HydatTimeIP {
  start_time: Construct;
  end_time: Construct;
  constructor(start_time: string, end_time?: string) {
    this.start_time = Construct.parse(start_time);
    if (end_time === undefined || end_time === "Infinity") {
      this.end_time = new Plus(new Constant(2), this.start_time);
    } else {
      this.end_time = Construct.parse(end_time);
    }
  }
}

interface HydatVariableRaw {
  unique_value: string;
}

type HydatTimeRaw = HydatTimePPRaw | HydatTimeIPRaw;
interface HydatTimePPRaw {
  time_point: string;
}
interface HydatTimeIPRaw {
  start_time: string;
  end_time: string;
}
