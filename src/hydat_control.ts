import { Hydat, HydatRaw } from './hydat';
import { StorageControl } from './storage_control';
import { GraphControl } from './graph_control';
import { PlotLineMapControl } from './plot_line_map_control';
import { PlotControl } from './plot_control';
import { DOMControl } from './dom_control';
import { DatGUIControl } from './dat_gui_control';

export interface HydatControl {
  current_hydat: Hydat | undefined;
  settingsForCurrentHydat: {
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
    loadHydat(JSON.parse(saved_hydat), {
      current_hydat: undefined,
      settingsForCurrentHydat: { plot_line_settings: [] },
    });
  }
}

export function saveHydat(hydatControl: HydatControl) {
  if (!hydatControl.current_hydat) return;
  const blob = new Blob([JSON.stringify(hydatControl.current_hydat.raw)]);
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

export function loadHydat(hydat: HydatRaw, hydatControl: HydatControl) {
  try {
    StorageControl.saveHydat(hydat);
    hydatControl.current_hydat = new Hydat(hydat);
    DatGUIControl.parameter_setting(hydatControl.current_hydat.parameters);
    GraphControl.modifyNameLabel(hydatControl.current_hydat.name);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    DOMControl.showToast('Failed to load hydat: ' + e.name + '(' + e.message + ')', 3000, 'red darken-4');
  }
  GraphControl.clearPlot();
  if (hydatControl.current_hydat !== undefined) {
    PlotLineMapControl.initVariableSelector(hydatControl.current_hydat);
  }
  PlotControl.update_axes(true);
}

/*export class HydatControl {
  static current_hydat: Hydat | undefined;
  static settingsForCurrentHydat: {
    plot_line_settings: {
      x: string;
      y: string;
      z: string;
      remove: () => void;
    }[];
  };

  static init(saved_hydat: string | null) {
    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }
  }

  /* function to save Hydat file */
/*
  static saveHydat() {
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

  static loadHydat(hydat: HydatRaw) {
    try {
      StorageControl.saveHydat(hydat);
      this.current_hydat = new Hydat(hydat);
      DatGUIControl.parameter_setting(this.current_hydat.parameters);
      GraphControl.modifyNameLabel(this.current_hydat.name);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      DOMControl.showToast('Failed to load hydat: ' + e.name + '(' + e.message + ')', 3000, 'red darken-4');
    }
    GraphControl.clearPlot();
    if (this.current_hydat !== undefined) {
      PlotLineMapControl.initVariableSelector(this.current_hydat);
    }
    PlotControl.update_axes(true);
  }
}
*/
