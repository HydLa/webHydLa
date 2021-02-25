/* eslint-disable @typescript-eslint/naming-convention */
// hydatのkeyがsnake_caseのため，Rawのプロパティもsnake_case

import { parse, Env, Construct, Constant, Plus } from './parse';

const isHydatParameterPointRaw = (raw: HydatParameterRaw): raw is HydatParameterPointRaw => {
  return (raw as HydatParameterPointRaw).unique_value !== undefined;
};

const isHydatParameterIntervalRaw = (raw: HydatParameterRaw): raw is HydatParameterIntervalRaw => {
  return (raw as HydatParameterIntervalRaw).lower_bounds !== undefined;
};

const isHydatTimePPRaw = (raw: HydatTimeRaw): raw is HydatTimePPRaw => {
  return (raw as HydatTimePPRaw).time_point !== undefined;
};

const translateParameterMap = (parameterMap: { [key: string]: HydatParameterRaw }) => {
  const map = new Map<string, HydatParameter>();
  for (const key in parameterMap) {
    const p = parameterMap[key];
    if (isHydatParameterPointRaw(p)) {
      map.set(key, new HydatParameterPoint(p.unique_value));
    } else if (isHydatParameterIntervalRaw(p)) {
      map.set(key, new HydatParameterInterval(p.lower_bounds, p.upper_bounds));
    } else {
      map.set(key, new HydatParameterInterval([p.lower_bound], [p.upper_bound]));
    }
  }
  return map;
};

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
  firstPhases: HydatPhase[];
  parameters: Map<string, HydatParameter>;
  variables: string[];
  raw: HydatRaw;

  constructor(hydat: HydatRaw) {
    this.raw = hydat;
    this.name = hydat.name;
    this.variables = hydat.variables;
    this.firstPhases = [];
    for (const ph of hydat.first_phases) {
      this.firstPhases.push(new HydatPhase(ph));
    }
    this.parameters = translateParameterMap(hydat.parameters);
  }
}

export interface HydatRaw {
  name: string;
  first_phases: HydatPhaseRaw[];
  parameters: { [key: string]: HydatParameterRaw }; // Mapにしない（JSON.parseの結果を格納するため）
  variables: string[];
}

export class HydatPhase {
  type: 'PP' | 'IP';
  time: HydatTime;
  variableMap: Env;
  parameterMaps: Map<string, HydatParameter>[];
  children: HydatPhase[];
  simulationState: string;

  constructor(phase: HydatPhaseRaw) {
    this.simulationState = phase.simulation_state;
    if (isHydatTimePPRaw(phase.time)) {
      // phase.type === "PP"
      this.type = 'PP';
      this.time = new HydatTimePP(phase.time.time_point);
    } else {
      this.type = 'IP';
      this.time = new HydatTimeIP(phase.time.start_time, phase.time.end_time);
    }

    this.variableMap = new Map();
    for (const key in phase.variable_map) {
      if (phase.variable_map[key].unique_value === undefined) {
        throw new HydatException(`webHydLa doesn't support ununique value in variable maps for ${key}`);
      }
      this.variableMap.set(key, parse(phase.variable_map[key].unique_value));
    }

    this.parameterMaps = [];
    for (const map of phase.parameter_maps) {
      this.parameterMaps.push(translateParameterMap(map));
    }

    this.children = [];
    for (const c of phase.children) {
      this.children.push(new HydatPhase(c));
    }
  }
}

interface HydatPhaseRaw {
  type: string;
  time: HydatTimeRaw;
  variable_map: { [key: string]: HydatVariableRaw }; // Mapにしない（JSON.parseの結果を格納するため）
  parameter_maps: { [key: string]: HydatParameterRaw }[]; // Mapにしない（JSON.parseの結果を格納するため）
  children: HydatPhaseRaw[];
  simulation_state: string;
}

export type HydatParameter = HydatParameterPoint | HydatParameterInterval;
export class HydatParameterPoint {
  uniqueValue: Construct;

  constructor(uniqueValue: string) {
    this.uniqueValue = parse(uniqueValue);
  }
}

// HydatのlowerBounds/upperBoundsは歴史的理由から配列となっているが、要素数は必ず1個以下である
type Bound = { value: Construct };

export class HydatParameterInterval {
  lowerBound: Bound;
  upperBound: Bound;

  constructor(lowerBounds: { value: string }[], upperBounds: { value: string }[]) {
    switch (lowerBounds.length) {
      case 0:
        this.lowerBound = { value: new Constant(-Infinity) };
        break;
      case 1:
        this.lowerBound = { value: parse(lowerBounds[0].value) };
        break;
      default:
        throw new Error(`Error: lowerBounds.length must be 0 or 1, but got ${lowerBounds.length}.`);
    }

    switch (upperBounds.length) {
      case 0:
        this.upperBound = { value: new Constant(Infinity) };
        break;
      case 1:
        this.upperBound = { value: parse(upperBounds[0].value) };
        break;
      default:
        throw new Error(`Error: upperBounds.length must be 0 or 1, but got ${upperBounds.length}.`);
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
  timePoint: Construct;
  constructor(timePoint: string) {
    this.timePoint = parse(timePoint);
  }
}

class HydatTimeIP {
  startTime: Construct;
  endTime: Construct;
  constructor(startTime: string, endTime?: string) {
    this.startTime = parse(startTime);
    if (endTime === undefined || endTime === 'Infinity') {
      this.endTime = new Plus(new Constant(2), this.startTime);
    } else {
      this.endTime = parse(endTime);
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
