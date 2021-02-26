import { Hydat, HydatRaw } from './hydat';
import { saveHydatToStorage } from './storage_control';
import { modifyNameLabel, clearPlot } from './graph_control';
import { initVariableSelector } from './plot_line_map_control';
import { showToast } from './dom_control';
import { parameterSetting } from './dat_gui_control';
import { updateAxes } from './plot_control';
import { saveFile } from './editor_control';

export class HydatControl {
  static currentHydat: Hydat | undefined;
  static settingsForCurrentHydat: {
    plotLineSettings: {
      x: string;
      y: string;
      z: string;
      remove: () => void;
    }[];
  };
}

export function initHydatControl(savedHydat: string | null) {
  if (savedHydat) {
    loadHydat(JSON.parse(savedHydat));
  }
}

/* function to save Hydat file */
export function saveHydat() {
  if (!HydatControl.currentHydat) return;
  saveFile('hydat', JSON.stringify(HydatControl.currentHydat.raw));
}

export function loadHydat(hydat: HydatRaw) {
  try {
    saveHydatToStorage(hydat);
    HydatControl.currentHydat = new Hydat(hydat);
    parameterSetting(HydatControl.currentHydat.parameters);
    modifyNameLabel(HydatControl.currentHydat.name);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    showToast(`Failed to load hydat: ${e.name}(${e.message})`, 3000, 'red darken-4');
  }
  clearPlot();
  if (HydatControl.currentHydat !== undefined) {
    initVariableSelector(HydatControl.currentHydat);
  }
  updateAxes(true);
}
