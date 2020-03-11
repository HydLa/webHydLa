import { plot_settings, dat_gui_parameter_folder, fixLayoutOfDatGUI, dat_gui_parameter_folder_seek, graph } from "./main";
import { plot_lines } from "./plot_line";

export let range_mode: boolean;

let dat_gui_parameter_items: dat.GUIController[] = [];
function parameter_setting(pars:{[key: string]: HydatParameter}) {
  for (var i = 0; i < dat_gui_parameter_items.length; i++) {
    dat_gui_parameter_folder.remove(dat_gui_parameter_items[i]);
  }
  dat_gui_parameter_items = [];
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
      dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'value', min_par_value, max_par_value).name(key);
    parameter_item.onChange((_) => { plot_lines.replotAll(); });
    parameter_item.step(step);

    let mode_item = dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'fixed');
    let mode_item_range = dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'range');
    dat_gui_parameter_items.push(mode_item);
    dat_gui_parameter_items.push(mode_item_range);
    dat_gui_parameter_items.push(parameter_item);

    mode_item.onChange(function (value) {
      if (!plot_settings.parameter_condition[key_copy].fixed) {
        parameter_item.min(1).max(100).step(1).setValue(5);
      }
      else {
        parameter_item.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value) / 2);
      }
      plot_lines.replotAll();
    });
    mode_item_range.onChange((_) => {
      range_mode = plot_settings.parameter_condition[key_copy].range
    });
  }
  if (Object.keys(pars).length > 0) dat_gui_parameter_folder.open();
  else dat_gui_parameter_folder.close();
  fixLayoutOfDatGUI();
}

let dat_gui_parameter_items_seek = [];
function parameter_seek_setting(line_len) {
  for (var i = 0; i < dat_gui_parameter_items_seek.length; i++) {
    dat_gui_parameter_folder_seek.remove(dat_gui_parameter_items_seek[i]);
  }
  dat_gui_parameter_items_seek = [];
  var lower = 0;
  var upper = line_len - 1;
  var min_par_value = 0;
  var max_par_value = line_len - 1;
  var step = 1;

  plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

  var parameter_item_seek =
    dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
  parameter_item_seek.onChange(function (value) {/*replot_all();*/graph.time = plot_settings.parameter_condition_seek.value; animate(); });
  parameter_item_seek.step(step);

  //var mode_item_seek = dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'stop');
  //dat_gui_parameter_items_seek.push(mode_item_seek);
  dat_gui_parameter_items_seek.push(parameter_item_seek);

  /*mode_item_seek.onChange(function(value){
      parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value)/2);
    replot_all();
  });*/
  dat_gui_parameter_folder_seek.open();
  //else dat_gui_parameter_folder_seek.close();
  fixLayoutOfDatGUI();
}


function parameter_seek_setting_animate(line_len, time_line) {
  for (var i = 0; i < dat_gui_parameter_items_seek.length; i++) {
    dat_gui_parameter_folder_seek.remove(dat_gui_parameter_items_seek[i]);
  }
  dat_gui_parameter_items_seek = [];
  var lower = 0;
  var upper = line_len;
  var min_par_value = 0;
  var max_par_value = line_len;
  var step = 1;

  plot_settings.parameter_condition_seek = new ParameterConditionSeek(min_par_value, max_par_value);

  var parameter_item_seek =
    dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
  parameter_item_seek.onChange(function (value) {/*replot_all();*/graph.time = plot_settings.parameter_condition_seek.value; animate(); });
  parameter_item_seek.step(step);

  //var mode_item_seek = dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'stop');
  //dat_gui_parameter_items_seek.push(mode_item_seek);
  dat_gui_parameter_items_seek.push(parameter_item_seek);

  parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue(time_line);
  dat_gui_parameter_folder_seek.open();
  //else dat_gui_parameter_folder_seek.close();
  fixLayoutOfDatGUI();
}
