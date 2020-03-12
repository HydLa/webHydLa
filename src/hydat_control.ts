import { Hydat, HydatRaw } from "./hydat";
import { StorageControl } from "./storage_control";
import { GraphControl } from "./graph_control";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";
import { DOMControl } from "./dom_control";
import { DatGUIControl } from "./dat_gui_control";

export class HydatControl{
  static current_hydat:Hydat;
  static settingsForCurrentHydat:{plot_line_settings:{
    x: string;
    y: string;
    z: string;
    remove: () => void;
    dashed: boolean;
  }[]};

  static init(saved_hydat:string) {
    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }
  }

  /* function to save Hydat file */
  static saveHydat() {
    var blob = new Blob([JSON.stringify(HydatControl.current_hydat)]);
    var object = window.URL.createObjectURL(blob);
    var d = new Date();
    var date = d.getFullYear() + "-" + d.getMonth() + 1 + "-" + d.getDate() + "T" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
    var a = document.createElement("a");
    a.href = object;
    a.download = date + ".hydat";
    var event = document.createEvent("MouseEvents");
    event.initMouseEvent(
      "click", true, false, window, 0, 0, 0, 0, 0
      , false, false, false, false, 0, null
    );
    a.dispatchEvent(event);
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
