let dat_gui_parameter_items = [];
function parameter_setting(pars) {
  for(var i = 0; i < dat_gui_parameter_items.length; i++)
  {
    dat_gui_parameter_folder.remove(dat_gui_parameter_items[i]);
  }
  dat_gui_parameter_items = [];
  plot_settings.parameter_condition = {};
  for(var key in pars){
    !function(key_copy){
      if(pars[key].unique_value != undefined)return;
      plot_settings.parameter_condition[key] = {};

      var lower = pars[key].lower_bounds[0].value.getValue();
      var upper = pars[key].upper_bounds[0].value.getValue();
      var min_par_value = parseFloat(lower);
      var max_par_value = parseFloat(upper);
      var step = (upper - lower)/100;
      
      plot_settings.parameter_condition[key].fixed = true;
      plot_settings.parameter_condition[key].range = false;
      plot_settings.parameter_condition[key].value = (min_par_value + max_par_value) / 2;
      plot_settings.parameter_condition[key].min_value = min_par_value;
      plot_settings.parameter_condition[key].max_value = max_par_value;
      var parameter_item =
          dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'value', min_par_value, max_par_value).name(key);
      parameter_item.onChange(function(value){replot_all()});
      parameter_item.step(step);

      var mode_item = dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'fixed');
      var mode_item_range = dat_gui_parameter_folder.add(plot_settings.parameter_condition[key], 'range');
      dat_gui_parameter_items.push(mode_item);
      dat_gui_parameter_items.push(mode_item_range);
      dat_gui_parameter_items.push(parameter_item);
      
      mode_item.onChange(function(value){
        if(!plot_settings.parameter_condition[key_copy].fixed)
        {
          parameter_item.min(1).max(100).step(1).setValue(5);
        }
        else
        {
          parameter_item.min(min_par_value).max(max_par_value).step(step).setValue((min_par_value + max_par_value)/2);
        }
        replot_all();
      });
      mode_item_range.onChange(function(value){
        range_mode = plot_settings.parameter_condition[key_copy].range
      });
    }(key);
  }
  if(Object.keys(pars).length > 0)dat_gui_parameter_folder.open();
  else dat_gui_parameter_folder.close();
  fixLayoutOfDatGUI();
}



let dat_gui_parameter_items_seek = [];
function parameter_seek_setting(line_len) {
  for(var i = 0; i < dat_gui_parameter_items_seek.length; i++)
  {
    dat_gui_parameter_folder_seek.remove(dat_gui_parameter_items_seek[i]);
  }
  dat_gui_parameter_items_seek = [];
  plot_settings.parameter_condition_seek = {};
      var lower = 0;
      var upper = line_len-1;
      var min_par_value = 0;
      var max_par_value = line_len-1;
      var step = 1;

      plot_settings.parameter_condition_seek.stop = false;
      plot_settings.parameter_condition_seek.value = (min_par_value + max_par_value) / 2;
      plot_settings.parameter_condition_seek.min_value = min_par_value;
      plot_settings.parameter_condition_seek.max_value = max_par_value;
      var parameter_item_seek = 
          dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
      parameter_item_seek.onChange(function(value){/*replot_all();*/time=plot_settings.parameter_condition_seek.value;animate();});
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
  for(var i = 0; i < dat_gui_parameter_items_seek.length; i++)
  {
    dat_gui_parameter_folder_seek.remove(dat_gui_parameter_items_seek[i]);
  }
  dat_gui_parameter_items_seek = [];
  plot_settings.parameter_condition_seek = {};
      var lower = 0;
      var upper = line_len;
      var min_par_value = 0;
      var max_par_value = line_len;
      var step = 1;

      plot_settings.parameter_condition_seek.stop = false;
      plot_settings.parameter_condition_seek.value = (min_par_value + max_par_value) / 2;
      plot_settings.parameter_condition_seek.min_value = min_par_value;
      plot_settings.parameter_condition_seek.max_value = max_par_value;
      var parameter_item_seek = 
          dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'value', min_par_value, max_par_value);
      parameter_item_seek.onChange(function(value){/*replot_all();*/time=plot_settings.parameter_condition_seek.value;animate();});
      parameter_item_seek.step(step);

      //var mode_item_seek = dat_gui_parameter_folder_seek.add(plot_settings.parameter_condition_seek, 'stop');
      //dat_gui_parameter_items_seek.push(mode_item_seek);
      dat_gui_parameter_items_seek.push(parameter_item_seek);
      
          parameter_item_seek.min(min_par_value).max(max_par_value).step(step).setValue(time_line);
  dat_gui_parameter_folder_seek.open();
  //else dat_gui_parameter_folder_seek.close();
  fixLayoutOfDatGUI();
}

function updateFolder(line, succeeded)
{
  if(succeeded)
  {
    var color_on_correct = "#303030";
    line.x_item.domElement.firstChild.style.backgroundColor =
      line.y_item.domElement.firstChild.style.backgroundColor =
      line.z_item.domElement.firstChild.style.backgroundColor = color_on_correct;
  }
  else
  {
    var elm = line.last_edited_input;
    if(elm == undefined)return;
    elm.style.backgroundColor = "#A00000";
  }
}


function createUpdateFunctionForLine(line, item)
{
  return function(value)
  {
    line.last_edited_input = item.domElement.firstChild;
    var val = item.domElement.firstChild.value;
    if(item.previousValue == undefined || val != item.previousValue)
    {
      try{
        parseValue(val);
        replot_all();
      }
      catch(e)
      {
        updateFolder(line, false);
      }
    }
    item.previousValue = val;
  }
}


function removeLine(line)
{
  if(Object.keys(plot_lines).length <= 1)
  {
    return;
  }
  dat_gui_variable_folder.removeFolder(line.folder.name);
  remove_plot(line);
  delete settingsForCurrentHydat.plot_line_settings[line.index];
  browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
  delete plot_lines[line.index];
}

var plotLineIndex = 0;

function addNewLine(x_name:string, y_name:string, z_name:string){
  while(plot_lines[plotLineIndex]){++plotLineIndex;}
  var line = addNewLineWithIndex(x_name, y_name, z_name, plotLineIndex);
  ++plotLineIndex;
  return line;
}

interface Line{
  index: number;
  name: string;
  folder: dat.GUI;
}

function addNewLineWithIndex(x_name:string, y_name:string, z_name:string, index:number) {

  var new_line:Line;
  if(x_name == undefined)x_name = "";
  if(y_name == undefined)y_name = "";
  if(z_name == undefined)z_name = "";
  new_line.index = index;
  new_line.name = "plot" + new_line.index;
  new_line.folder = dat_gui_variable_folder.addFolder(new_line.name);
  new_line.settings = {x: x_name, y: y_name, z: z_name, remove:function(){removeLine(new_line)}, dashed:false};
  new_line.x_item = new_line.folder.add(new_line.settings, "x");
  new_line.x_item.onChange(createUpdateFunctionForLine(new_line, new_line.x_item));
  new_line.y_item = new_line.folder.add(new_line.settings, "y");
  new_line.y_item.onChange(createUpdateFunctionForLine(new_line, new_line.y_item));
  new_line.z_item = new_line.folder.add(new_line.settings, "z");
  new_line.folder.add(new_line.settings, "remove");
  new_line.folder.add(new_line.settings, "dashed").onChange(function(){replot(new_line)});
  new_line.z_item.onChange(createUpdateFunctionForLine(new_line, new_line.z_item));
  fixLayoutOfDatGUI();
  plot_lines[new_line.index] = new_line;
  return new_line;
}


function addNewLineWithIndexGuard(x_name, y_name, z_name, index) {
  if(new_guard!=undefined){
    new_guard.index = 1 + index;
    delete plot_lines[new_guard.index];
  }
  var new_guard = {};
  if(x_name == undefined)x_name = "";
  if(y_name == undefined)y_name = "";
  if(z_name == undefined)z_name = "";
  new_guard.index = 1 + index;
  new_guard.name = "plot" + new_guard.index;
  new_guard.folder = dat_gui_variable_folder.addFolder(new_guard.name);
  new_guard.settings = {x: x_name, y: y_name, z: z_name, remove:function(){removeLine(new_guard)}};
  new_guard.x_item = new_guard.folder.add(new_guard.settings, "x");
  //new_line.x_item.onChange(createUpdateFunctionForLine(new_line, new_line.x_item));
  new_guard.y_item = new_guard.folder.add(new_guard.settings, "y");
  //new_line.y_item.onChange(createUpdateFunctionForLine(new_line, new_line.y_item));
  new_guard.z_item = new_guard.folder.add(new_guard.settings, "z");
  new_guard.folder.add(new_guard.settings, "remove");
  //new_line.z_item.onChange(createUpdateFunctionForLine(new_line, new_line.z_item));
  //fixLayoutOfDatGUI();
  new_guard.remain = true;
  plot_lines[new_guard.index] = new_guard;
  //return new_line;
}



