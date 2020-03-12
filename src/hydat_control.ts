import { Hydat, HydatRaw } from "./hydat";
import { StorageControl } from "./storage_control";
import { GraphControl } from "./graph_control";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";
import { DOMControl } from "./dom_control";
import { DatGUIControl } from "./dat_gui_control";

export class HydatControl{
  static current_hydat:Hydat;
  static settingsForCurrentHydat = {};

  static init(saved_hydat:string) {
    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }
  }

  static loadHydat(hydat:HydatRaw) {
    try {
      StorageControl.saveHydat(hydat);
      this.current_hydat = new Hydat(hydat);
      DatGUIControl.parameter_setting(this.current_hydat.parameters);
      GraphControl.modifyNameLabel(this.current_hydat.name);
    }
    catch (e) {
      console.log(e);
      console.log(e.stack);
      DOMControl.showToast("Failed to load hydat: " + e.name + "(" + e.message + ")", 3000, "red darken-4");
    }
    GraphControl.clearPlot();
    PlotLineMapControl.initVariableSelector(this.current_hydat);
    PlotControl.update_axes(true);
  }
}
