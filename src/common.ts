import { GraphControl } from "./graph_control";
import { DatGUIControl } from "./dat_gui_control";
import { NewUI } from "./new_ui";
import { PlotSettingsControl } from "./plot_settings";
import { DOMControl } from "./dom_control";
import { EditorControl } from "./editor_control";
import { StorageControl } from "./storage_control";
import { Hydat } from "./hydat";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";

export class CommonData {
  current_hydat:Hydat;
  settingsForCurrentHydat = {};

  constructor() {
    PlotLineMapControl.init();
    NewUI.init(GraphControl.controls);
    DOMControl.init();
    StorageControl.init();

    const saved_hydla = StorageControl.loadHydla();
    const saved_hydat = StorageControl.loadHydat();

    EditorControl.init(saved_hydla);

    PlotSettingsControl.init();
    DatGUIControl.init(PlotSettingsControl.plot_settings);
    PlotControl.init(PlotSettingsControl.plot_settings);

    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }

    this.graph.update2DMode(this.plot_settings.twoDimensional);
    this.time_stop();

    this.graph.render();
  }
  
  loadHydat(hydat:HydatRaw) {
    try {
      this.browser_storage.setItem("hydat", JSON.stringify(hydat));
      this.current_hydat = new Hydat(hydat);
      parameter_setting(this.current_hydat.parameters);
      modifyNameLabel(this.current_hydat.name);
    }
    catch (e) {
      console.log(e);
      console.log(e.stack);
      DOMControl.showToast("Failed to load hydat: " + e.name + "(" + e.message + ")", 3000, "red darken-4");
    }
    this.graph.clearPlot();
    this.initVariableSelector(hydat);
    update_axes(true);
  }
}
