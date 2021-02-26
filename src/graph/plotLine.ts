import { removeLine } from './plotLineMap';
import { DatGUIState } from './datGUI';
import { replotAll } from './graph';
import { Triplet } from './plotUtils';
import { dfsEachLine, resetAnimation } from './animation';
import { setPlotStartTimeIfUnset } from './plot';
import { saveHydatSettingsToStorage } from '../storage';
import { HydatState, HydatPhase } from '../hydat/hydat';
import { parse, ParamCond, Construct } from '../hydat/parse';

export class PlotLine {
  index: number;
  name: string;
  folder: dat.GUI;
  settings: {
    x: string;
    y: string;
    z: string;
    remove: () => void;
  };
  xItem: dat.GUIController;
  yItem: dat.GUIController;
  zItem: dat.GUIController;
  remain: boolean | undefined;
  colorAngle = 0;
  lastEditedInput: HTMLInputElement | undefined;
  plotting = false;
  plotReady: number | undefined;
  plotInformation: PlotInformation | undefined;

  lastPlotTime = 0;

  plot: (THREE.Mesh | THREE.Line)[] | undefined;

  constructor(xName: string, yName: string, zName: string, index: number) {
    this.index = index;
    this.name = `plot${this.index}`;
    this.folder = DatGUIState.variableFolder.addFolder(this.name);
    this.settings = {
      x: xName,
      y: yName,
      z: zName,
      remove: () => {
        removeLine(this);
      },
    };
    this.folder.add(this.settings, 'remove');

    this.xItem = this.folder.add(this.settings, 'x');
    this.xItem.onChange(getUpdateFunction(this, this.xItem));
    this.yItem = this.folder.add(this.settings, 'y');
    this.yItem.onChange(getUpdateFunction(this, this.yItem));
    this.zItem = this.folder.add(this.settings, 'z');
    this.zItem.onChange(getUpdateFunction(this, this.zItem));
  }
}

export function getUpdateFunction(plotLine: PlotLine, item: dat.GUIController) {
  let prev: string;
  return () => {
    plotLine.lastEditedInput = <HTMLInputElement>item.domElement.firstChild;
    const val = (<HTMLInputElement>item.domElement.firstChild).value;
    if (prev === undefined || val !== prev) {
      try {
        parse(val);
        replotAll();
      } catch (e) {
        updateFolder(plotLine, false);
      }
    }
    prev = val;
  };
}

export function updateFolder(plotLine: PlotLine, succeeded: boolean) {
  if (succeeded) {
    const colorOnCorrect = '#303030';
    (<HTMLInputElement>plotLine.xItem.domElement.firstChild).style.backgroundColor = (<HTMLInputElement>(
      plotLine.yItem.domElement.firstChild
    )).style.backgroundColor = (<HTMLInputElement>(
      plotLine.zItem.domElement.firstChild
    )).style.backgroundColor = colorOnCorrect;
  } else {
    const elm = plotLine.lastEditedInput;
    if (elm === undefined) return;
    elm.style.backgroundColor = '#A00000';
  }
}

export function removeFolder(plotLine: PlotLine) {
  plotLine.folder.close();
  DatGUIState.variableFolder.removeFolder(plotLine.folder);
}

export function replot(plotLine: PlotLine) {
  resetAnimation(plotLine);
  if (plotLine.settings.x !== '' && plotLine.settings.y !== '' && plotLine.settings.z !== '') {
    if (plotLine.remain === undefined) {
      HydatState.settingsForCurrentHydat.plotLineSettings[plotLine.index] = plotLine.settings;
      saveHydatSettingsToStorage();
    }
  }
}

export function plotReady(plotLine: PlotLine) {
  const plotInformation = plotLine.plotInformation;
  if (!plotInformation) {
    throw new Error('unexpected: plotInformation is undefined');
  }
  if (plotInformation.line.plotting) {
    plotLine.plotReady = requestAnimationFrame(() => {
      plotReady(plotLine);
    });
  } else {
    plotLine.plotting = true;
    plotLine.plotReady = undefined;
    plotLine.lastPlotTime = new Date().getTime();
    setPlotStartTimeIfUnset(new Date().getTime());
    dfsEachLine(
      plotInformation.phaseIndexArray,
      plotInformation.axes,
      plotInformation.line,
      plotInformation.width,
      plotInformation.color,
      plotInformation.dt,
      plotInformation.parameterConditionList,
      0,
      []
    );
  }
}

interface PlotInformation {
  phaseIndexArray: { phase: HydatPhase; index: number }[];
  axes: Triplet<Construct>;
  line: PlotLine;
  width: number;
  color: number[];
  dt: number;
  parameterConditionList: ParamCond[];
}
