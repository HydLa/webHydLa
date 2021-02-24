import { PlotLine } from './plot_line';
import { Hydat } from './hydat';
import { GraphControl } from './graph_control';
import { DatGUIControl } from './dat_gui_control';
import { HydatControl } from './hydat_control';
import { StorageControl } from './storage_control';
import { remove_dynamic_line, remove_dynamic_lines, remove_plot } from './animation_control';
import { PlotSettingsControl } from './plot_settings';

export class PlotLineMapControl {
  static map: { [key: number]: PlotLine } = {};
  static plotLineIndex = 0;
  static init() {
    /* nop */
  }
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
    DatGUIControl.variable_folder.removeFolder(line.folder);
    if (PlotSettingsControl.plot_settings.dynamicDraw) {
      remove_dynamic_line(line);
    } else {
      remove_plot(line);
    }
    delete HydatControl.settingsForCurrentHydat.plot_line_settings[line.index];
    StorageControl.saveHydatSettings();
    delete this.map[line.index];
  }
  static addNewLine(x_name: string, y_name: string, z_name: string) {
    while (this.map[this.plotLineIndex]) {
      ++this.plotLineIndex;
    }
    const line = this.addNewLineWithIndex(x_name, y_name, z_name, this.plotLineIndex);
    ++this.plotLineIndex;
    return line;
  }
  static addNewLineWithIndex(x_name: string, y_name: string, z_name: string, index: number) {
    const line = new PlotLine(x_name, y_name, z_name, index);
    DatGUIControl.fixLayout();
    this.map[index] = line;
    return line;
  }
  static removeAllFolders() {
    for (const i in this.map) {
      this.map[i].removeFolder();
    }
  }

  static isAllReady() {
    for (const i in this.map) {
      if (this.map[i].plotting || this.map[i].plot_ready !== undefined) {
        return false;
      }
    }
    return true;
  }

  /** @deprecated */
  static replot() {
    if (PlotSettingsControl.plot_settings.dynamicDraw) {
      PlotSettingsControl.plot_settings.plotInterval = 0.01;
    }
    remove_dynamic_lines();

    for (const i in this.map) {
      this.map[i].color_angle = (parseInt(i) / this.getLength()) * 360;
      this.map[i].replot();
    }
  }

  /* function to update variable selector for graph */
  static initVariableSelector(hydat: Hydat) {
    this.removeAllFolders();
    this.reset();

    const str = StorageControl.loadHydatSettings(hydat.name);
    if (str !== null) {
      HydatControl.settingsForCurrentHydat = JSON.parse(str);
      const line_settings = HydatControl.settingsForCurrentHydat.plot_line_settings;
      for (const i in line_settings) {
        const index = parseInt(i);
        if (line_settings[index] === null) continue;
        const line = this.addNewLineWithIndex(
          line_settings[index].x,
          line_settings[index].y,
          line_settings[index].z,
          index
        );
        if (line.settings.x != '' || line.settings.y != '' || line.settings.z != '') line.folder.open();
      }
      GraphControl.replotAll();
    }

    if (this.getLength() == 0) {
      HydatControl.settingsForCurrentHydat = { plot_line_settings: [] };
      const first_line = this.addNewLine(
        't',
        HydatControl.current_hydat !== undefined ? HydatControl.current_hydat.variables[0] : '',
        '0'
      );
      first_line.color_angle = 0;
      first_line.replot();
      first_line.folder.open();
    }

    DatGUIControl.variable_folder.open();
  }
}
