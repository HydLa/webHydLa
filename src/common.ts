import { GraphControl } from "./graph_control";
import { DatGUIControl } from "./dat_gui_control";
import { NewUI } from "./new_ui";
import { PlotSettingsControl } from "./plot_settings";
import { DOMControl } from "./dom_control";
import { EditorControl } from "./editor_control";
import { StorageControl } from "./storage_control";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";
import { HydatControl } from "./hydat_control";

export class CommonData {
  constructor() {
    GraphControl.init();
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

    HydatControl.init(saved_hydat);

    GraphControl.update2DMode(PlotSettingsControl.plot_settings.twoDimensional);
    PlotSettingsControl.time_stop();

    GraphControl.render();
  }
}
