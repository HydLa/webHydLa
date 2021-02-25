import { removeFolder, replot, PlotLine } from './plot_line';
import { Hydat } from './hydat';
import { replotAll } from './graph_control';
import { fixLayout, DatGUIState } from './dat_gui_control';
import { HydatControl } from './hydat_control';
import { saveHydatSettingsToStorage, loadHydatSettingsFromStorage } from './storage_control';
import { removeDynamicLine, removeDynamicLines, removePlot } from './animation_control';
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
  DatGUIState.variableFolder.removeFolder(line.folder);
  if (PlotSettingsControl.plotSettings.dynamicDraw) {
    removeDynamicLine(line);
  } else {
    removePlot(line);
  }
  delete HydatControl.settingsForCurrentHydat.plotLineSettings[line.index];
  saveHydatSettingsToStorage();
  PlotLineMapControl.map.delete(line.index);
}

export function addNewLine(xName: string, yName: string, zName: string) {
  while (PlotLineMapControl.map.has(PlotLineMapControl.plotLineIndex)) {
    ++PlotLineMapControl.plotLineIndex;
  }
  const line = addNewLineWithIndex(xName, yName, zName, PlotLineMapControl.plotLineIndex);
  ++PlotLineMapControl.plotLineIndex;
  return line;
}

export function addNewLineWithIndex(xName: string, yName: string, zName: string, index: number) {
  const line = new PlotLine(xName, yName, zName, index);
  fixLayout();
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
    if (line.plotting || line.plotReady !== undefined) {
      return false;
    }
  }
  return true;
}

/** @deprecated */
export function replotLines() {
  if (PlotSettingsControl.plotSettings.dynamicDraw) {
    PlotSettingsControl.plotSettings.plotInterval = 0.01;
  }
  removeDynamicLines();

  for (const [i, line] of PlotLineMapControl.map.entries()) {
    line.colorAngle = (i / getLength()) * 360;
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
    const lineSettings = HydatControl.settingsForCurrentHydat.plotLineSettings;
    for (const i in lineSettings) {
      const index = parseInt(i);
      if (lineSettings[index] === null) continue;
      const line = addNewLineWithIndex(lineSettings[index].x, lineSettings[index].y, lineSettings[index].z, index);
      if (line.settings.x != '' || line.settings.y != '' || line.settings.z != '') line.folder.open();
    }
    replotAll();
  }

  if (getLength() == 0) {
    HydatControl.settingsForCurrentHydat = { plotLineSettings: [] };
    const firstLine = addNewLine(
      't',
      HydatControl.currentHydat !== undefined ? HydatControl.currentHydat.variables[0] : '',
      '0'
    );
    firstLine.colorAngle = 0;
    replot(firstLine);
    firstLine.folder.open();
  }

  DatGUIState.variableFolder.open();
}
