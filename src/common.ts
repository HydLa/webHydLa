import { Graph } from "./graph";
import { PlotLineMap } from "./plot_line_map";
import { DatGUIControl } from "./dat_gui_control";
import { NewUI } from "./new_ui";
import { PlotSettings } from "./plot_settings";
import { DOMControl } from "./dom_control";
import { EditorControl } from "./editor_control";
import { StorageControl } from "./storage_control";
import { Hydat } from "./hydat";

export class CommonData {
  plot_settings: PlotSettings;
  graph = new Graph();
  plot_lines = new PlotLineMap();
  dat_gui_control: DatGUIControl;

  current_hydat:Hydat;
  settingsForCurrentHydat = {};

  editor_control: EditorControl;

  constructor() {
    NewUI.init(this.graph.controls);
    DOMControl.init(this.graph, this.editor_control);
    StorageControl.init();

    const saved_hydla = StorageControl.loadHydla();
    const saved_hydat = StorageControl.loadHydat();

    this.editor_control = new EditorControl(saved_hydla);

    this.plot_settings = StorageControl.loadPlotSettings();
    // var controler;
    this.dat_gui_control = new DatGUIControl();

    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }

    if (this.plot_settings.backgroundColor !== undefined) {
      setBackgroundColor(this.plot_settings.backgroundColor);
    }

    this.graph.update2DMode(this.plot_settings.twoDimensional);
    this.time_stop();

    this.graph.render();
  }
  time_stop() {
    this.graph.animatable = !this.plot_settings.animate;
  }
  seek() {
    //if(plot_settings.animate)
    this.graph.time = this.plot_settings.seek;
    this.graph.animate();
  }
  fixLayoutOfDatGUI() {
    this.dat_gui_control.fixLayout();
  }

  /* function to update variable selector for graph */
  initVariableSelector(hydat) {
    this.plot_lines.removeAllFolders();

    this.plot_lines.reset();

    //var guard_list ={x:["x", "xSWON"]};

    let str = this.browser_storage.getItem(hydat.name);
    if (str !== null) {
      this.settingsForCurrentHydat = JSON.parse(str);
      var line_settings = this.settingsForCurrentHydat.plot_line_settings;
      for (var i in line_settings) {
        let line = this.plot_lines.addNewLineWithIndex(line_settings[i].x, line_settings[i].y, line_settings[i].z, i);
        /*for(key in guard_list){
          if(line_settings[i].x == key){
            for(var l in guard_list.x){
              addNewLineWithIndexGuard(guard_list.x[l], "x'", "0", i+l);
            }
          }
        }*/
        if (line.settings.x != "" || line.settings.y != "" || line.settings.z != "") line.folder.open();
      }
      this.graph.replotAll();
    }

    if (this.plot_lines.getLength() == 0) {
      this.settingsForCurrentHydat = { plot_line_settings: {} };
      let first_line = this.plot_lines.addNewLine("t", this.current_hydat !== undefined ? this.current_hydat.variables[0] : "", "0");
      first_line.color_angle = 0;
      first_line.replot();
      first_line.folder.open();
    }

    dat_gui_variable_folder.open();
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
      showToast("Failed to load hydat: " + e.name + "(" + e.message + ")", 3000, "red darken-4");
    }
    this.graph.clearPlot();
    this.initVariableSelector(hydat);
    update_axes(true);
  }
}
