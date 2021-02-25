import * as dat from 'dat.gui';
import { graphControl, updateRotate, update2DMode, replotAll } from './graph_control';
import { PlotSettings, PlotSettingsControl, ParameterCondition, ParameterConditionSeek } from './plot_settings';
import { addNewLine } from './plot_line_map_control';
import { HydatParameter, HydatParameterPoint } from './hydat';
import { seekAnimation } from './animation_control';
import { setBackgroundColor, update_axes } from './plot_control';

/** 描画用設定の処理を行う */
export class DatGUIControl {
  static parameter_folder: dat.GUI;
  static variable_folder: dat.GUI;
  static parameter_folder_seek: dat.GUI;

  static parameter_items: dat.GUIController[] = [];
  static parameter_items_seek: dat.GUIController[] = [];

  static plot_settings: PlotSettings;

  static init(plot_settings: PlotSettings) {
    this.plot_settings = plot_settings;
    const add_line_obj = {
      add: function () {
        const line = addNewLine('', '', '');
        line.folder.open();
      },
    };
    const dat_gui = new dat.GUI({ autoPlace: false, load: localStorage });
    const dat_gui_animate = new dat.GUI({ autoPlace: false, load: localStorage });
    dat_gui
      .add(plot_settings, 'plotInterval', 0.01, 1)
      .step(0.001)
      .name('plot interval')
      .onChange(() => {
        replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'lineWidth', 1, 10)
      .step(1)
      .name('line width')
      .onChange(() => {
        replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'scaleLabelVisible')
      .name('show scale label')
      .onChange(() => {
        update_axes(true);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'twoDimensional')
      .name('XY-mode')
      .onChange(() => {
        update2DMode(plot_settings.twoDimensional);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'autoRotate')
      .name('auto rotate')
      .onChange(() => {
        updateRotate(plot_settings.autoRotate);
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .add(plot_settings, 'dynamicDraw')
      .name('dynamic draw')
      .onChange(() => {
        replotAll();
        PlotSettingsControl.saveToWebStorage();
      });
    dat_gui
      .addColor(plot_settings, 'backgroundColor')
      .name('background')
      .onChange((value) => {
        setBackgroundColor(value);
        PlotSettingsControl.saveToWebStorage(); /*render_three_js();i*/
      });
    dat_gui_animate
      .add(plot_settings, 'animate')
      .name('stop')
      .onChange(() => {
        PlotSettingsControl.time_stop();
        PlotSettingsControl.saveToWebStorage();
      });

    dat_gui.domElement.style.zIndex = '2';
    dat_gui_animate.domElement.style.zIndex = '3';
    dat_gui_animate.domElement.style['position'] = 'absolute';
    dat_gui_animate.domElement.style['bottom'] = '50px';

    const height_area = $('#graph-area').css('height');

    this.parameter_folder = dat_gui.addFolder('parameters');
    this.parameter_folder_seek = dat_gui_animate.addFolder('seek');
    dat_gui.add(add_line_obj, 'add').name('add new line');
    this.variable_folder = dat_gui.addFolder('variables');

    const dat_container = document.getElementById('dat-gui')!;
    dat_container.appendChild(dat_gui.domElement);

    const dat_container_b = document.getElementById('dat-gui-bottom')!;
    dat_container_b.style.height = height_area;
    dat_container_b.appendChild(dat_gui_animate.domElement);

    const nd_mode_check_box = <HTMLInputElement>document.getElementById('nd_mode_check_box');
    nd_mode_check_box.checked = true;

    this.fixLayout();
  }

  static parameter_setting(pars: Map<string, HydatParameter>) {
    for (const item of this.parameter_items) {
      this.parameter_folder.remove(item);
    }
    this.parameter_items = [];
    DatGUIControl.plot_settings.parameter_condition = {};
    for (const [key, par] of pars) {
      const key_copy = key;
      if (par instanceof HydatParameterPoint) return;

      const lower = par.lower_bound.value.getValue({});
      const upper = par.upper_bound.value.getValue({});
      if (!isFinite(lower) && !isFinite(upper)) {
        throw new Error('Error: at least one of lower_bound and upper_bound must be finite.');
      }

      const min_par_value = isFinite(lower) ? lower : upper - 100;
      const max_par_value = isFinite(upper) ? upper : lower + 100;
      const step = (max_par_value - min_par_value) / 100;

      DatGUIControl.plot_settings.parameter_condition[key] = new ParameterCondition(min_par_value, max_par_value);

      const parameter_item = this.parameter_folder
        .add(DatGUIControl.plot_settings.parameter_condition[key], 'value', min_par_value, max_par_value)
        .name(key);
      parameter_item.onChange(() => {
        replotAll();
      });
      parameter_item.step(step);

      const mode_item = this.parameter_folder.add(DatGUIControl.plot_settings.parameter_condition[key], 'fixed');
      const mode_item_range = this.parameter_folder.add(DatGUIControl.plot_settings.parameter_condition[key], 'range');
      this.parameter_items.push(mode_item);
      this.parameter_items.push(mode_item_range);
      this.parameter_items.push(parameter_item);

      mode_item.onChange(function () {
        if (!DatGUIControl.plot_settings.parameter_condition![key_copy].fixed) {
          parameter_item.min(1).max(100).step(1).setValue(5);
        } else {
          parameter_item
            .min(min_par_value)
            .max(max_par_value)
            .step(step)
            .setValue((min_par_value + max_par_value) / 2);
        }
        replotAll();
      });
      mode_item_range.onChange(() => {
        graphControl.range_mode = DatGUIControl.plot_settings.parameter_condition![key_copy].range;
      });
    }
    if (pars.size > 0) this.parameter_folder.open();
    else this.parameter_folder.close();
    this.fixLayout();
  }
  static parameter_seek_setting(line_len: number) {
    for (const item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    const min_par_value = 0;
    const max_par_value = line_len - 1;
    const step = 1;

    DatGUIControl.plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

    const parameter_item_seek = this.parameter_folder_seek.add(
      DatGUIControl.plot_settings.parameter_condition_seek,
      'value',
      min_par_value,
      max_par_value
    );
    parameter_item_seek.onChange(() => {
      seekAnimation(DatGUIControl.plot_settings.parameter_condition_seek!.value);
    });
    parameter_item_seek.step(step);

    this.parameter_items_seek.push(parameter_item_seek);

    this.parameter_folder_seek.open();
    this.fixLayout();
  }
  static parameter_seek_setting_animate(line_len: number, time_line: number) {
    for (const item of this.parameter_items_seek) {
      this.parameter_folder_seek.remove(item);
    }
    this.parameter_items_seek = [];
    const min_par_value = 0;
    const max_par_value = line_len;
    const step = 1;

    DatGUIControl.plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

    const parameter_item_seek = this.parameter_folder_seek.add(
      DatGUIControl.plot_settings.parameter_condition_seek,
      'value',
      min_par_value,
      max_par_value
    );
    parameter_item_seek.onChange(() => {
      seekAnimation(DatGUIControl.plot_settings.parameter_condition_seek!.value);
    });
    parameter_item_seek.step(step);

    this.parameter_items_seek.push(parameter_item_seek);

    parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue(time_line);
    this.parameter_folder_seek.open();
    this.fixLayout();
  }
  static fixLayout() {
    // to avoid layout collapsion of dat gui
    const dg_c_inputs = $('.dg .c input[type=text]');
    for (const input of dg_c_inputs) {
      input.style.height = '100%';
    }

    const selectors = $('.selector');
    for (const selector of selectors) {
      selector.style.width = '100%';
    }
  }
}
