import { PlotLine } from "./plot_line";
import { Hydat } from "./hydat";
import { GraphControl } from "./graph_control";
import { DatGUIControl } from "./dat_gui_control";

export class PlotLineMapControl {
  static map: { [key: number]: PlotLine } = {};
  static plotLineIndex = 0;
  static init() { /* nop */ }
  static reset() {
    this.map = {};
    this.plotLineIndex = 0;
  }
  static getLength() {
    return Object.keys(this.map).length;
  }
  static removeLine(line: PlotLine) {
    if (this.getLength() <= 1) {
      return;
    }
    dat_gui_variable_folder.removeFolder(line.folder);
    remove_plot(line);
    delete settingsForCurrentHydat.plot_line_settings[line.index];
    browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
    delete this.map[line.index];
  }
  static addNewLine(x_name: string, y_name: string, z_name: string) {
    while (this.map[this.plotLineIndex]) { ++this.plotLineIndex; }
    const line = this.addNewLineWithIndex(x_name, y_name, z_name, this.plotLineIndex);
    ++this.plotLineIndex;
    return line;
  }
  static addNewLineWithIndex(x_name: string, y_name: string, z_name: string, index: number) {
    const line = new PlotLine(x_name, y_name, z_name, index);
    fixLayoutOfDatGUI();
    this.map[index] = line;
    return line;
  }
  // addNewLineWithIndexGuard(x_name: string, y_name: string, z_name: string, index: number) {
  //   // if(new_guard!=undefined){
  //   //   new_guard.index = 1 + index;
  //   //   delete this.map[new_guard.index];
  //   // }
  //   let new_guard = new PlotLine(x_name, y_name, z_name, index + 1);
  //   new_guard.remain = true;
  //   this.map[new_guard.index] = new_guard;
  //   //return new_line;
  // }
  static removeAllFolders() {
    for (let i in this.map) {
      this.map[i].removeFolder();
    }
  }

  static isAllReady() {
    for (let i in this.map) {
      if (this.map[i].plotting || this.map[i].plot_ready !== undefined) {
        return false;
      }
    }
    return true;
  }

  /** @deprecated */ 
  static replot() {
    // var table = document.getElementById("graph_axis_table");
    for (let i in this.map) {
      this.map[i].color_angle = parseInt(i) / this.getLength() * 360;
      this.map[i].replot();
    }
  }

  /* function to update variable selector for graph */
  static initVariableSelector(hydat:Hydat) {
    this.removeAllFolders();
    this.reset();

    //var guard_list ={x:["x", "xSWON"]};

    let str = this.browser_storage.getItem(hydat.name);
    if (str !== null) {
      this.settingsForCurrentHydat = JSON.parse(str);
      var line_settings = this.settingsForCurrentHydat.plot_line_settings;
      for (var i in line_settings) {
        let line = this.addNewLineWithIndex(line_settings[i].x, line_settings[i].y, line_settings[i].z, i);
        /*for(key in guard_list){
          if(line_settings[i].x == key){
            for(var l in guard_list.x){
              addNewLineWithIndexGuard(guard_list.x[l], "x'", "0", i+l);
            }
          }
        }*/
        if (line.settings.x != "" || line.settings.y != "" || line.settings.z != "") line.folder.open();
      }
      GraphControl.replotAll();
    }

    if (this.getLength() == 0) {
      this.settingsForCurrentHydat = { plot_line_settings: {} };
      let first_line = this.addNewLine("t", this.current_hydat !== undefined ? this.current_hydat.variables[0] : "", "0");
      first_line.color_angle = 0;
      first_line.replot();
      first_line.folder.open();
    }

    DatGUIControl.variable_folder.open();
  }
}