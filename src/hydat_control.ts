import { Hydat, HydatRaw } from './hydat';
import { saveHydatToStorage } from './storage_control';
import { modifyNameLabel, clearPlot } from './graph_control';
import { initVariableSelector } from './plot_line_map_control';
import { showToast } from './dom_control';
import { DatGUIControl } from './dat_gui_control';
import { update_axes } from './plot_control';

export class HydatControl {
  static current_hydat: Hydat | undefined;
  static settingsForCurrentHydat: {
    plot_line_settings: {
      x: string;
      y: string;
      z: string;
      remove: () => void;
    }[];
  };
}

export function initHydatControl(saved_hydat: string | null) {
  if (saved_hydat) {
    loadHydat(JSON.parse(saved_hydat));
  }
}

/* function to save Hydat file */
export function saveHydat() {
  if (!HydatControl.current_hydat) return;
  const blob = new Blob([JSON.stringify(HydatControl.current_hydat.raw)]);
  const object = window.URL.createObjectURL(blob);
  const d = new Date();
  const date =
    d.getFullYear() +
    '-' +
    d.getMonth() +
    1 +
    '-' +
    d.getDate() +
    'T' +
    d.getHours() +
    '-' +
    d.getMinutes() +
    '-' +
    d.getSeconds();
  const a = document.createElement('a');
  a.href = object;
  a.download = date + '.hydat';
  const event = document.createEvent('MouseEvents');
  event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(event);
}

export function loadHydat(hydat: HydatRaw) {
  try {
    saveHydatToStorage(hydat);
    HydatControl.current_hydat = new Hydat(hydat);
    DatGUIControl.parameter_setting(HydatControl.current_hydat.parameters);
    modifyNameLabel(HydatControl.current_hydat.name);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    showToast(`Failed to load hydat: ${e.name}(${e.message})`, 3000, 'red darken-4');
  }
  clearPlot();
  if (HydatControl.current_hydat !== undefined) {
    initVariableSelector(HydatControl.current_hydat);
  }
  update_axes(true);
}
