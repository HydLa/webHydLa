import * as dat from "dat.gui";
import { GraphControl } from "./graph_control";
export let range_mode: boolean;

export class DatGUIControl{
  static parameter_folder: dat.GUI;
  static variable_folder: dat.GUI;
  static parameter_folder_seek: dat.GUI;

  static parameter_items: dat.GUIController[] = [];
  static parameter_items_seek = [];

  static init() {
    var add_line_obj = { add: function () { var line = addNewLine("", "", ""); line.folder.open(); } };
    let dat_gui = new dat.GUI({ autoPlace: false, load: localStorage });
    let dat_gui_animate = new dat.GUI({ autoPlace: false, load: localStorage });
    dat_gui
      .add(plot_settings, 'plotInterval', 0.01, 1)
      .step(0.001)
      .name('plot interval')
      .onChange((_) => {
        GraphControl.replotAll();
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'lineWidth', 1, 10)
      .step(1)
      .name('line width')
      .onChange((_) => {
        GraphControl.replotAll();
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'scaleLabelVisible')
      .name("show scale label")
      .onChange((_) => {
        update_axes(true);
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'twoDimensional')
      .name("XY-mode")
      .onChange((_) => {
        this.graph.update2DMode(this.plot_settings.twoDimensional);
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'autoRotate')
      .name("auto rotate")
      .onChange((_) => {
        this.graph.updateRotate(this.plot_settings.autoRotate);
        savePlotSettings();
      });
    dat_gui
      .addColor(plot_settings, 'backgroundColor')
      .name('background')
      .onChange((value) => {
        setBackgroundColor(value);
        savePlotSettings();/*render_three_js();i*/
      });
    dat_gui_animate
      .add(plot_settings, 'animate')
      .name("stop")
      .onChange((_) => {
        time_stop();
        savePlotSettings();
      });
    //dat_gui_animate.add(plot_settings, 'seek', 0, 1000).step(1).name('seek').onChange(function(value){seek();savePlotSettings();});

    dat_gui.domElement.style['z-index'] = 2;
    dat_gui_animate.domElement.style['z-index'] = 3;
    dat_gui_animate.domElement.style['position'] = 'absolute';
    dat_gui_animate.domElement.style['bottom'] = '50px';
    //dat_gui_animate.domElement.style['margin'] = '0 auto';

    var height_area = $("#graph-area").css("height");
    //var width_area = $("#graph-area").css("width");

    this.parameter_folder = dat_gui.addFolder('parameters');
    this.parameter_folder_seek = dat_gui_animate.addFolder('seek');
    dat_gui.add(add_line_obj, 'add').name("add new line");
    this.variable_folder = dat_gui.addFolder('variables');

    var dat_container = document.getElementById('dat-gui');
    dat_container.appendChild(dat_gui.domElement);

    var dat_container_b = document.getElementById('dat-gui-bottom');
    dat_container_b.style.height = height_area;
    dat_container_b.appendChild(dat_gui_animate.domElement);

    let nd_mode_check_box = <HTMLInputElement>document.getElementById("nd_mode_check_box")
    nd_mode_check_box.checked = true;

    this.fixLayout();
  }

  static parameter_setting(pars:{[key: string]: HydatParameter}) {
    for (let item of this.parameter_items) {
      this.parameter_folder.remove(item);
    }
    this.parameter_items = [];
    plot_settings.parameter_condition = {};
    for (let key in pars) {
      const par = pars[key];
      let key_copy = key;
      if (par instanceof HydatParameterPoint) return;
  
      let lower = par.lower_bounds[0].value.getValue({});
      let upper = par.upper_bounds[0].value.getValue({});
      let min_par_value = lower;
      let max_par_value = upper;
      let step = (upper - lower) / 100;
  
      plot_settings.parameter_condition[key] = new ParameterCondition(min_par_value, max_par_value);
  
      let parameter_item =
        this.parameter_folder.add(plot_settings.parameter_condition[key], 'value', min_par_value, max_par_value).name(key);
      parameter_item.onChange((_) => { GraphControl.replotAll(); });
      parameter_item.step(step);
  
      let mode_item = this.parameter_folder.add(plot_settings.parameter_condition[key], 'fixed');
      let mode_item_range = this.parameter_folder.add(plot_settings.parameter_condition[key], 'range');
      this.parameter_items.push(mode_item);
      this.parameter_items.push(mode_item_range);
      this.parameter_items.push(parameter_item);
  
      mode_item.onChange(function (value) {
        if (!plot_settings.parameter_condition[key_copy].fixed) {
          parameter_item.min(1).max(100).step(1).setValue(5);
        }
        else {
          parameter_item.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value) / 2);
        }
        GraphControl.replotAll();
      });
      mode_item_range.onChange((_) => {
        range_mode = plot_settings.parameter_condition[key_copy].range
      });
    }
    if (Object.keys(pars).length > 0) this.parameter_folder.open();
    else this.parameter_folder.close();
    this.fixLayout();
  }
  static parameter_seek_setting(line_len:number) {
    for (let item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    // var lower = 0;
    // var upper = line_len - 1;
    var min_par_value = 0;
    var max_par_value = line_len - 1;
    var step = 1;
  
    plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);
  
    var parameter_item_seek =
      this.parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
    parameter_item_seek.onChange(function (value) {/*GraphControl.replotAll();*/graph.time = plot_settings.parameter_condition_seek.value; animate(); });
    parameter_item_seek.step(step);
  
    //var mode_item_seek = this.parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'stop');
    //this.parameter_items_seek.push(mode_item_seek);
    this.parameter_items_seek.push(parameter_item_seek);
  
    /*mode_item_seek.onChange(function(value){
        parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value)/2);
      GraphControl.replotAll();
    });*/
    this.parameter_folder_seek.open();
    //else this.parameter_folder_seek.close();
    this.fixLayout();
  }
  static parameter_seek_setting_animate(line_len, time_line) {
    for (let item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    // var lower = 0;
    // var upper = line_len;
    var min_par_value = 0;
    var max_par_value = line_len;
    var step = 1;
  
    plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);
  
    var parameter_item_seek =
      this.parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
    parameter_item_seek.onChange(function (value) {/*GraphControl.replotAll();*/graph.time = plot_settings.parameter_condition_seek.value; animate(); });
    parameter_item_seek.step(step);
  
    //var mode_item_seek = this.parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'stop');
    //this.parameter_items_seek.push(mode_item_seek);
    this.parameter_items_seek.push(parameter_item_seek);
  
    parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue(time_line);
    this.parameter_folder_seek.open();
    //else this.parameter_folder_seek.close();
    this.fixLayout();
  }
  static fixLayout() {
    // to avoid layout collapsion of dat gui
    let dg_c_inputs = $('.dg .c input[type=text]');
    for (let input of dg_c_inputs) {
      input.style.height = '100%';
    }
  
    let selectors = $('.selector');
    for (let selector of selectors) {
      selector.style.width = '100%';
    }
  }
}
