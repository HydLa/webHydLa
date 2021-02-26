import { removeFolder, replot, PlotLine } from './plotLine';
import { HydatState, Hydat } from './hydat';
import { replotAll } from './graph';
import { fixLayout, DatGUIState } from './datGUI';
import { saveHydatSettingsToStorage, loadHydatSettingsFromStorage } from './storage';
import { removeDynamicLine, removeDynamicLines, removePlot } from './animation';
import { PlotSettingsControl } from './plotSettings';

export class PlotLineMapState {
  static map = new Map<number, PlotLine>();
  static plotLineIndex = 0;
}

export function reset() {
  PlotLineMapState.map.clear();
  PlotLineMapState.plotLineIndex = 0;
}

export function getLength() {
  return PlotLineMapState.map.size;
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
  delete HydatState.settingsForCurrentHydat.plotLineSettings[line.index];
  saveHydatSettingsToStorage();
  PlotLineMapState.map.delete(line.index);
}

export function addNewLine(xName: string, yName: string, zName: string) {
  while (PlotLineMapState.map.has(PlotLineMapState.plotLineIndex)) {
    ++PlotLineMapState.plotLineIndex;
  }
  const line = addNewLineWithIndex(xName, yName, zName, PlotLineMapState.plotLineIndex);
  ++PlotLineMapState.plotLineIndex;
  return line;
}

export function addNewLineWithIndex(xName: string, yName: string, zName: string, index: number) {
  const line = new PlotLine(xName, yName, zName, index);
  fixLayout();
  PlotLineMapState.map.set(index, line);
  return line;
}

export function removeAllFolders() {
  for (const line of PlotLineMapState.map.values()) {
    removeFolder(line);
  }
}

export function isAllReady() {
  for (const line of PlotLineMapState.map.values()) {
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

  for (const [i, line] of PlotLineMapState.map.entries()) {
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
    HydatState.settingsForCurrentHydat = JSON.parse(str);
    const lineSettings = HydatState.settingsForCurrentHydat.plotLineSettings;
    for (const i in lineSettings) {
      const index = parseInt(i);
      if (lineSettings[index] === null) continue;
      const line = addNewLineWithIndex(lineSettings[index].x, lineSettings[index].y, lineSettings[index].z, index);
      if (line.settings.x != '' || line.settings.y != '' || line.settings.z != '') line.folder.open();
    }
    replotAll();
  }

  if (getLength() == 0) {
    HydatState.settingsForCurrentHydat = { plotLineSettings: [] };
    const firstLine = addNewLine(
      't',
      HydatState.currentHydat !== undefined ? HydatState.currentHydat.variables[0] : '',
      '0'
    );
    firstLine.colorAngle = 0;
    replot(firstLine);
    firstLine.folder.open();
  }

  DatGUIState.variableFolder.open();
}
