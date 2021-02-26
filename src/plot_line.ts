import { PlotLineMapControl } from './plot_line_map_control';
import { DatGUIControl } from './dat_gui_control';
import { GraphControl } from './graph_control';
import { PlotControl } from './plot_control';
import { AnimationControl } from './animation_control';
import { HydatControl } from './hydat_control';
import { StorageControl } from './storage_control';
import { Triplet } from './plot_utils';
import { HydatPhase } from './hydat';
import { parse, Construct, Constant } from './parse';

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
    this.name = 'plot' + this.index;
    this.folder = DatGUIControl.variable_folder.addFolder(this.name);
    this.settings = {
      x: x_name,
      y: y_name,
      z: z_name,
      remove: () => {
        PlotLineMapControl.removeLine(this);
      },
    };
    this.x_item = this.folder.add(this.settings, 'x');
    this.x_item.onChange(this.getUpdateFunction(this.x_item));
    this.y_item = this.folder.add(this.settings, 'y');
    this.y_item.onChange(this.getUpdateFunction(this.y_item));
    this.z_item = this.folder.add(this.settings, 'z');
    this.folder.add(this.settings, 'remove');
    this.z_item.onChange(this.getUpdateFunction(this.z_item));
  }

  getUpdateFunction(item: dat.GUIController) {
    let prev: string;
    return () => {
      this.last_edited_input = <HTMLInputElement>item.domElement.firstChild;
      const val = (<HTMLInputElement>item.domElement.firstChild).value;
      if (prev === undefined || val != prev) {
        try {
          parse(val);
          GraphControl.replotAll();
        } catch (e) {
          this.updateFolder(false);
        }
      }
      prev = val;
    };
  }

  updateFolder(succeeded: boolean) {
    if (succeeded) {
      const color_on_correct = '#303030';
      (<HTMLInputElement>this.x_item.domElement.firstChild).style.backgroundColor = (<HTMLInputElement>(
        this.y_item.domElement.firstChild
      )).style.backgroundColor = (<HTMLInputElement>(
        this.z_item.domElement.firstChild
      )).style.backgroundColor = color_on_correct;
    } else {
      const elm = this.last_edited_input;
      if (elm === undefined) return;
      elm.style.backgroundColor = '#A00000';
    }
  }

  removeFolder() {
    this.folder.close();
    DatGUIControl.variable_folder.removeFolder(this.folder);
  }

  replot() {
    AnimationControl.reset(this);
    if (this.settings.x != '' && this.settings.y != '' && this.settings.z != '') {
      if (this.remain === undefined) {
        HydatControl.settingsForCurrentHydat.plot_line_settings[this.index] = this.settings;
        StorageControl.saveHydatSettings();
      }
    }
  }

  plotReady() {
    const plot_information = this.plot_information;
    if (!plot_information) {
      throw new Error('unexpected: plot_information is undefined');
    }
    if (plot_information.line.plotting) {
      this.plot_ready = requestAnimationFrame(() => {
        this.plotReady();
      });
    } else {
      this.plotting = true;
      this.plot_ready = undefined;
      this.last_plot_time = new Date().getTime();
      if (PlotControl.PlotStartTime === undefined) PlotControl.PlotStartTime = new Date().getTime();
      AnimationControl.dfs_each_line(
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
}

interface PlotInformation {
  phase_index_array: { phase: HydatPhase; index: number }[];
  axes: Triplet<Construct>;
  line: PlotLine;
  width: number;
  color: number[];
  dt: number;
  parameter_condition_list: { [key: string]: Constant }[];
}
