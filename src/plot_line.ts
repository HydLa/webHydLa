import { removeLine } from './plot_line_map_control';
import { DatGUIState } from './dat_gui_control';
import { replotAll } from './graph_control';
import { HydatControl } from './hydat_control';
import { saveHydatSettingsToStorage } from './storage_control';
import { Triplet } from './plot_utils';
import { HydatPhase } from './hydat';
import { parse, ParamCond, Construct } from './parse';
import { dfsEachLine, resetAnimation } from './animation_control';
import { setPlotStartTimeIfUnset } from './plot_control';

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
  x_item: dat.GUIController;
  y_item: dat.GUIController;
  z_item: dat.GUIController;
  remain: boolean | undefined;
  color_angle = 0;
  last_edited_input: HTMLInputElement | undefined;
  plotting = false;
  plot_ready: number | undefined;
  plot_information: PlotInformation | undefined;

  last_plot_time = 0;

  plot: (THREE.Mesh | THREE.Line)[] | undefined;

  constructor(x_name: string, y_name: string, z_name: string, index: number) {
    this.index = index;
    this.name = `plot${this.index}`;
    this.folder = DatGUIState.variableFolder.addFolder(this.name);
    this.settings = {
      x: x_name,
      y: y_name,
      z: z_name,
      remove: () => {
        removeLine(this);
      },
    };
    this.folder.add(this.settings, 'remove');

    this.x_item = this.folder.add(this.settings, 'x');
    this.x_item.onChange(getUpdateFunction(this, this.x_item));
    this.y_item = this.folder.add(this.settings, 'y');
    this.y_item.onChange(getUpdateFunction(this, this.y_item));
    this.z_item = this.folder.add(this.settings, 'z');
    this.z_item.onChange(getUpdateFunction(this, this.z_item));
  }
}

export function getUpdateFunction(plotLine: PlotLine, item: dat.GUIController) {
  let prev: string;
  return () => {
    plotLine.last_edited_input = <HTMLInputElement>item.domElement.firstChild;
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
    const color_on_correct = '#303030';
    (<HTMLInputElement>plotLine.x_item.domElement.firstChild).style.backgroundColor = (<HTMLInputElement>(
      plotLine.y_item.domElement.firstChild
    )).style.backgroundColor = (<HTMLInputElement>(
      plotLine.z_item.domElement.firstChild
    )).style.backgroundColor = color_on_correct;
  } else {
    const elm = plotLine.last_edited_input;
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
      HydatControl.settingsForCurrentHydat.plot_line_settings[plotLine.index] = plotLine.settings;
      saveHydatSettingsToStorage();
    }
  }
}

export function plotReady(plotLine: PlotLine) {
  const plot_information = plotLine.plot_information;
  if (!plot_information) {
    throw new Error('unexpected: plot_information is undefined');
  }
  if (plot_information.line.plotting) {
    plotLine.plot_ready = requestAnimationFrame(() => {
      plotReady(plotLine);
    });
  } else {
    plotLine.plotting = true;
    plotLine.plot_ready = undefined;
    plotLine.last_plot_time = new Date().getTime();
    setPlotStartTimeIfUnset(new Date().getTime());
    dfsEachLine(
      plot_information.phase_index_array,
      plot_information.axes,
      plot_information.line,
      plot_information.width,
      plot_information.color,
      plot_information.dt,
      plot_information.parameter_condition_list,
      0,
      []
    );
  }
}

interface PlotInformation {
  phase_index_array: { phase: HydatPhase; index: number }[];
  axes: Triplet<Construct>;
  line: PlotLine;
  width: number;
  color: number[];
  dt: number;
  parameter_condition_list: ParamCond[];
}
