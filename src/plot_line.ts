import { PlotLineMapControl } from "./plot_line_map_control";
import { DatGUIControl } from "./dat_gui_control";
import { GraphControl } from "./graph_control";
import { PlotControl } from "./plot_control";
import { AnimationControl } from "./animation_control";

export class PlotLine {
  index: number;
  name: string;
  folder: dat.GUI;
  settings: {
    x: string;
    y: string;
    z: string;
    remove: () => void;
    dashed: boolean;
  };
  x_item: dat.GUIController;
  y_item: dat.GUIController;
  z_item: dat.GUIController;
  remain: boolean;
  color_angle: number;
  last_edited_input: HTMLInputElement;
  plotting: boolean;
  plot_ready: number;
  plot_information: PlotInformation;

  last_plot_time: number;

  constructor(x_name: string, y_name: string, z_name: string, index: number) {
    this.index = index;
    this.name = "plot" + this.index;
    this.folder = DatGUIControl.variable_folder.addFolder(this.name);
    this.settings = { x: x_name, y: y_name, z: z_name, remove: () => { PlotLineMapControl.removeLine(this) }, dashed: false };
    this.x_item = this.folder.add(this.settings, "x");
    this.x_item.onChange(this.getUpdateFunction(this.x_item));
    this.y_item = this.folder.add(this.settings, "y");
    this.y_item.onChange(this.getUpdateFunction(this.y_item));
    this.z_item = this.folder.add(this.settings, "z");
    this.folder.add(this.settings, "remove");
    this.folder.add(this.settings, "dashed").onChange(function () { replot(this) });
    this.z_item.onChange(this.getUpdateFunction(this.z_item));
  }

  getUpdateFunction(item: dat.GUIController) {
    let prev: string;
    return (value) => {
      this.last_edited_input = <HTMLInputElement>item.domElement.firstChild;
      let val = (<HTMLInputElement>item.domElement.firstChild).value;
      if (prev === undefined || val != prev) {
        try {
          Construct.parse(val);
          GraphControl.replotAll();
        }
        catch (e) {
          this.updateFolder(false);
        }
      }
      prev = val;
    }
  }

  updateFolder(succeeded: boolean) {
    if (succeeded) {
      var color_on_correct = "#303030";
      (<HTMLInputElement>this.x_item.domElement.firstChild).style.backgroundColor =
        (<HTMLInputElement>this.y_item.domElement.firstChild).style.backgroundColor =
        (<HTMLInputElement>this.z_item.domElement.firstChild).style.backgroundColor = color_on_correct;
    }
    else {
      var elm = this.last_edited_input;
      if (elm === undefined) return;
      elm.style.backgroundColor = "#A00000";
    }
  }

  removeFolder() {
    this.folder.close();
    dat_gui_variable_folder.removeFolder(this.folder);
  }

  replot() {
    AnimationControl.reset(this);
    if (this.settings.x != "" && this.settings.y != "" && this.settings.z != "") {
      if (this.remain === undefined) {
        settingsForCurrentHydat.plot_line_settings[this.index] = this.settings;
        browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
      }
    }
  }

  plotReady() {
    var plot_information = this.plot_information;
    if (plot_information.line.plotting) {
      let that = this;
      this.plot_ready = requestAnimationFrame(function () { that.plotReady() });
    }
    else {
      this.plotting = true;
      this.plot_ready = undefined;
      this.last_plot_time = new Date().getTime();
      if (PlotControl.PlotStartTime === undefined) PlotControl.PlotStartTime = new Date().getTime();
      PlotControl.add_plot_each(plot_information.phase_index_array, plot_information.axes, plot_information.line, plot_information.width, plot_information.color, plot_information.dt, plot_information.parameter_condition_list, 0, []);
    }
  }
}

class PlotInformation{
  phase_index_array: { phase, index: number }[];
  axes;
  line: PlotLine;
  width: number;
  color:number[];
  dt: number;
  parameter_condition_list;
}

