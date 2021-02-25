import { removeFolder, replot, PlotLine } from './plot_line';
import { Hydat } from './hydat';
import { replotAll } from './graph_control';
import { DatGUIControl } from './dat_gui_control';
import { HydatControl } from './hydat_control';
import { saveHydatSettingsToStorage, loadHydatSettingsFromStorage } from './storage_control';
import { remove_dynamic_line, remove_dynamic_lines, remove_plot } from './animation_control';
import { PlotSettingsControl } from './plot_settings';

export class PlotLineMapControl {
  static map = new Map<number, PlotLine>();
  static plotLineIndex = 0;
}

export function reset() {
  PlotLineMapControl.map.clear();
  PlotLineMapControl.plotLineIndex = 0;
}

export function getLength() {
  return PlotLineMapControl.map.size;
}

export function removeLine(line: PlotLine) {
  if (getLength() <= 1) {
    return;
  }
  DatGUIControl.variable_folder.removeFolder(line.folder);
  if (PlotSettingsControl.plot_settings.dynamicDraw) {
    remove_dynamic_line(line);
  } else {
    remove_plot(line);
  }
  delete HydatControl.settingsForCurrentHydat.plot_line_settings[line.index];
  saveHydatSettingsToStorage();
  PlotLineMapControl.map.delete(line.index);
}

export function addNewLine(x_name: string, y_name: string, z_name: string) {
  while (PlotLineMapControl.map.has(PlotLineMapControl.plotLineIndex)) {
    ++PlotLineMapControl.plotLineIndex;
  }
  const line = addNewLineWithIndex(x_name, y_name, z_name, PlotLineMapControl.plotLineIndex);
  ++PlotLineMapControl.plotLineIndex;
  return line;
}

export function addNewLineWithIndex(x_name: string, y_name: string, z_name: string, index: number) {
  const line = new PlotLine(x_name, y_name, z_name, index);
  DatGUIControl.fixLayout();
  PlotLineMapControl.map.set(index, line);
  return line;
}

export function removeAllFolders() {
  for (const line of PlotLineMapControl.map.values()) {
    removeFolder(line);
  }
}

export function isAllReady() {
  for (const line of PlotLineMapControl.map.values()) {
    if (line.plotting || line.plot_ready !== undefined) {
      return false;
    }
  }
  return true;
}

/** @deprecated */
export function replotLines() {
  if (PlotSettingsControl.plot_settings.dynamicDraw) {
    PlotSettingsControl.plot_settings.plotInterval = 0.01;
  }
  remove_dynamic_lines();

  for (const [i, line] of PlotLineMapControl.map.entries()) {
    line.color_angle = (i / getLength()) * 360;
    replot(line);
  }
}

/* function to update variable selector for graph */
export function initVariableSelector(hydat: Hydat) {
  removeAllFolders();
  reset();

  const str = loadHydatSettingsFromStorage(hydat.name);
  if (str !== null) {
    HydatControl.settingsForCurrentHydat = JSON.parse(str);
    const line_settings = HydatControl.settingsForCurrentHydat.plot_line_settings;
    for (const i in line_settings) {
      const index = parseInt(i);
      if (line_settings[index] === null) continue;
      const line = addNewLineWithIndex(line_settings[index].x, line_settings[index].y, line_settings[index].z, index);
      if (line.settings.x != '' || line.settings.y != '' || line.settings.z != '') line.folder.open();
    }
    replotAll();
  }

  if (getLength() == 0) {
    HydatControl.settingsForCurrentHydat = { plot_line_settings: [] };
    const first_line = addNewLine(
      't',
      HydatControl.current_hydat !== undefined ? HydatControl.current_hydat.variables[0] : '',
      '0'
    );
    first_line.color_angle = 0;
    replot(first_line);
    first_line.folder.open();
  }

  DatGUIControl.variable_folder.open();
}
