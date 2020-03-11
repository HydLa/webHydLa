import { Graph } from "./three_init";
import { PlotLineMap } from "./plot_line";
import { DatGUIControl } from "./graph_axis";
import Materialize from "materialize-css";
import { NewUI } from "./new_ui";

const key_binding_selector = <HTMLSelectElement>document.getElementById("key_binding_selector");
const theme_selector = <HTMLSelectElement>document.getElementById("theme_selector");

export class CommonData {
  plot_settings: PlotSettings;
  graph = new Graph();
  plot_lines = new PlotLineMap();
  dat_gui_control: DatGUIControl;
  browser_storage: Storage;

  current_hydat:Hydat;
  settingsForCurrentHydat = {};

  new_ui: NewUI;

  constructor() {
    this.browser_storage = localStorage;

    this.new_ui = new NewUI(this.graph.controls);

    /* initialize materialize components */
    $('#file-dropdown-button').dropdown({
      constrainWidth: true,
      hover: false,
    });
    $('.axis-dropdown-button').dropdown({
      constrainWidth: false,
      hover: false
    });
    $('.modal-trigger').modal();
    $('ui.tabs').tabs();

    $("fix_button").on('change', function () {
      replot_all();
    });
    $("step_button").on('change', function () {
      replot_all();
    });

    loadThemeFromWebstorage();
    loadKeyBindingFromWebstorage();
    $('select').formSelect();

    this.plot_settings = PlotSettings.parseJSON(browser_storage.getItem('plot_settings'));
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
  savePlotSettings() {
    browser_storage.setItem("plot_settings", JSON.stringify(plot_settings));
  }

  /* function to save editor into Web Storage */
  saveKeyBindingToWebstorage() {
    var bind_selector = key_binding_selector.value;
    browser_storage.setItem("key_binding", bind_selector);
  }

  loadKeyBindingFromWebstorage() {
    var key_binding_setting = browser_storage.getItem("key_binding");
    if (key_binding_setting != undefined) {
      key_binding_selector.value = browser_storage.getItem("key_binding");
    }
    else {
      key_binding_selector.value = key_binding_selector.options[key_binding_selector.selectedIndex].value;
      browser_storage.setItem("key_binding", key_binding_selector.value);
    }
    if (key_binding_selector.value == "") editor.setKeyboardHandler(null);
    else editor.setKeyboardHandler(key_binding_selector.value);
  }

  /* function to save theme into Web Storage */
  saveThemeToWebstorage() {
    var theme = theme_selector.value;
    browser_storage.setItem("theme", theme);
  }

  loadThemeFromWebstorage() {
    var theme_setting = browser_storage.getItem("theme");
    if (theme_setting != undefined) {
      theme_selector.value = browser_storage.getItem("theme");
    } else {
      browser_storage.setItem("theme", theme_selector.value);
    }
    editor.setTheme("ace/theme/" + theme_selector.value);
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
      this.plot_lines.replotAll();
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

  showToast(message: string, duration: number, classes: string) {
    Materialize.toast({ html: message, displayLength: duration, classes: classes });
    let toast_container = document.getElementById("toast-container");
    const MAX_CHILDREN_NUM = 5;
    if (toast_container.children.length > MAX_CHILDREN_NUM) {
      for (let i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++) {
        toast_container.removeChild(toast_container.children[i]);
      }
    }
  }
}
