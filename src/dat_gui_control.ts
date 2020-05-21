import * as dat from "dat.gui";
import { GraphControl } from "./graph_control";
import { PlotSettings, PlotSettingsControl, ParameterCondition, ParameterConditionSeek } from "./plot_settings";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";
import { HydatParameter, HydatParameterPoint } from "./hydat";
import { AnimationControl } from "./animation_control";

/** 描画用設定の処理を行う */
export class DatGUIControl {
  static parameter_folder: dat.GUI;
  static variable_folder: dat.GUI;
  static parameter_folder_seek: dat.GUI;

  static parameter_items: dat.GUIController[] = [];
  static parameter_items_seek: dat.GUIController[] = [];

  static plot_settings: PlotSettings

  static init(plot_settings: PlotSettings) {
    this.plot_settings = plot_settings;
    const add_line_obj = { add: function () { var line = PlotLineMapControl.addNewLine("", "", ""); line.folder.open(); } };
    let dat_gui = new dat.GUI({ autoPlace: false, load: localStorage });
    let dat_gui_animate = new dat.GUI({ autoPlace: false, load: localStorage });
    dat_gui
      .add(plot_settings, 'plotInterval', 0.01, 1)
      .step(0.001)
      .name('plot interval')
      .onChange((_) => {
        GraphControl.replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'lineWidth', 1, 10)
      .step(1)
      .name('line width')
      .onChange((_) => {
        GraphControl.replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'scaleLabelVisible')
      .name("show scale label")
      .onChange((_) => {
        PlotControl.update_axes(true);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'twoDimensional')
      .name("XY-mode")
      .onChange((_) => {
        GraphControl.update2DMode(plot_settings.twoDimensional);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'autoRotate')
      .name("auto rotate")
      .onChange((_) => {
        GraphControl.updateRotate(plot_settings.autoRotate);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'dynamicDraw')
      .name("dynamic draw")
      .onChange((_) => {
        GraphControl.replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .addColor(plot_settings, 'backgroundColor')
      .name('background')
      .onChange((value) => {
        PlotControl.setBackgroundColor(value);
        PlotSettingsControl.saveToWebStorage();/*render_three_js();i*/
      });
    dat_gui_animate
      .add(plot_settings, 'animate')
      .name("stop")
      .onChange((_) => {
        PlotSettingsControl.time_stop();
        PlotSettingsControl.saveToWebStorage();
      });

    dat_gui.domElement.style.zIndex = "2";
    dat_gui_animate.domElement.style.zIndex = "3";
    dat_gui_animate.domElement.style['position'] = 'absolute';
    dat_gui_animate.domElement.style['bottom'] = '50px';

    var height_area = $("#graph-area").css("height");

    this.parameter_folder = dat_gui.addFolder('parameters');
    this.parameter_folder_seek = dat_gui_animate.addFolder('seek');
    dat_gui.add(add_line_obj, 'add').name("add new line");
    this.variable_folder = dat_gui.addFolder('variables');

    var dat_container = document.getElementById('dat-gui')!;
    dat_container.appendChild(dat_gui.domElement);

    var dat_container_b = document.getElementById('dat-gui-bottom')!;
    dat_container_b.style.height = height_area;
    dat_container_b.appendChild(dat_gui_animate.domElement);

    let nd_mode_check_box = <HTMLInputElement>document.getElementById("nd_mode_check_box")
    nd_mode_check_box.checked = true;

    this.fixLayout();
  }

  static parameter_setting(pars: { [key: string]: HydatParameter }) {
    for (let item of this.parameter_items) {
      this.parameter_folder.remove(item);
    }
    this.parameter_items = [];
    DatGUIControl.plot_settings.parameter_condition = {};
    for (let key in pars) {
      const par = pars[key];
      let key_copy = key;
      if (par instanceof HydatParameterPoint) return;

      let lower = par.lower_bounds[0].value.getValue({});
      let upper = par.upper_bounds[0].value.getValue({});
      let min_par_value = lower;
      let max_par_value = upper;
      let step = (upper - lower) / 100;

      DatGUIControl.plot_settings.parameter_condition[key] = new ParameterCondition(min_par_value, max_par_value);

      let parameter_item =
        this.parameter_folder.add(DatGUIControl.plot_settings.parameter_condition[key], 'value', min_par_value, max_par_value).name(key);
      parameter_item.onChange((_) => { GraphControl.replotAll(); });
      parameter_item.step(step);

      let mode_item = this.parameter_folder.add(DatGUIControl.plot_settings.parameter_condition[key], 'fixed');
      let mode_item_range = this.parameter_folder.add(DatGUIControl.plot_settings.parameter_condition[key], 'range');
      this.parameter_items.push(mode_item);
      this.parameter_items.push(mode_item_range);
      this.parameter_items.push(parameter_item);

      mode_item.onChange(function (value) {
        if (!DatGUIControl.plot_settings.parameter_condition![key_copy].fixed) {
          parameter_item.min(1).max(100).step(1).setValue(5);
        }
        else {
          parameter_item.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value) / 2);
        }
        GraphControl.replotAll();
      });
      mode_item_range.onChange((_) => {
        GraphControl.range_mode = DatGUIControl.plot_settings.parameter_condition![key_copy].range
      });
    }
    if (Object.keys(pars).length > 0) this.parameter_folder.open();
    else this.parameter_folder.close();
    this.fixLayout();
  }
  static parameter_seek_setting(line_len: number) {
    for (let item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    var min_par_value = 0;
    var max_par_value = line_len - 1;
    var step = 1;

    DatGUIControl.plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

    var parameter_item_seek =
      this.parameter_folder_seek.add(DatGUIControl.plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
    parameter_item_seek.onChange((value) => {
      AnimationControl.time = DatGUIControl.plot_settings.parameter_condition_seek!.value;
      AnimationControl.animate();
    });
    parameter_item_seek.step(step);

    this.parameter_items_seek.push(parameter_item_seek);

    this.parameter_folder_seek.open();
    this.fixLayout();
  }
  static parameter_seek_setting_animate(line_len: number, time_line: number) {
    for (let item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    var min_par_value = 0;
    var max_par_value = line_len;
    var step = 1;

    DatGUIControl.plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

    var parameter_item_seek =
      this.parameter_folder_seek.add(DatGUIControl.plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
    parameter_item_seek.onChange((value) => {
      AnimationControl.time = DatGUIControl.plot_settings.parameter_condition_seek!.value;
      AnimationControl.animate();
    });
    parameter_item_seek.step(step);

    this.parameter_items_seek.push(parameter_item_seek);

    parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue(time_line);
    this.parameter_folder_seek.open();
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
