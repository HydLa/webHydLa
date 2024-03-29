/**
 * ローカルストレージに保存してある設定を呼び出したり、ローカルストレージに保存したりする。
 * web ページを離れても戻ったら再度同じ設定が呼び出される。
 */

import { PlotSettings, PlotSettingsControl } from './graph/plotSettings';
import { HydatState, HydatRaw } from './hydat/hydat';
import { setEditorKeyBinding, setEditorTheme } from './editor/editor';

const storage = localStorage;

const themeSelector = <HTMLSelectElement>document.getElementById('theme_selector');
const keyBindingSelector = <HTMLSelectElement>document.getElementById('key_binding_selector');

export function initStorage() {
  loadThemeFromStorage();
  loadKeyBindingFromStorage();
}

export function saveKeyBindingToStorage() {
  const bindSelector = keyBindingSelector.value;
  storage.setItem('key_binding', bindSelector);
}

export function loadKeyBindingFromStorage() {
  const keyBindingSetting = storage.getItem('key_binding');
  if (keyBindingSetting !== null) {
    keyBindingSelector.value = keyBindingSetting;
  } else {
    keyBindingSelector.value = keyBindingSelector.options[keyBindingSelector.selectedIndex].value;
    storage.setItem('key_binding', keyBindingSelector.value);
  }
  if (keyBindingSelector.value == '') setEditorKeyBinding(null);
  else setEditorKeyBinding(keyBindingSelector.value);
}

/* function to save theme into Web Storage */
export function saveThemeToStorage() {
  const theme = themeSelector.value;
  storage.setItem('theme', theme);
}

export function loadThemeFromStorage() {
  const themeSetting = storage.getItem('theme');
  if (themeSetting !== null) {
    themeSelector.value = themeSetting;
  } else {
    storage.setItem('theme', themeSelector.value);
  }
  setEditorTheme(themeSelector.value);
}

/* function to save HydLa code into Web Storage */
export function saveHydlaToStorage(hydla: string) {
  storage.setItem('hydla', hydla);
}

export function loadHydlaFromStorage() {
  return storage.getItem('hydla');
}

export function saveHydatToStorage(hydat: HydatRaw) {
  storage.setItem('hydat', JSON.stringify(hydat));
}

export function loadHydatFromStorage() {
  return storage.getItem('hydat');
}

export function savePlotSettingsToStorage(plotSettings: PlotSettings) {
  storage.setItem('plot_settings', JSON.stringify(plotSettings));
}

export function loadPlotSettingsFromStorage() {
  return PlotSettingsControl.parseJSON(storage.getItem('plot_settings'));
}

export function saveHydlaNameToStorage(hydlaName: string) {
  storage.setItem('hydla_name', hydlaName);
}

export function loadHydlaNameFromStorage() {
  return storage.getItem('hydla_name');
}

export function saveHydatSettingsToStorage() {
  if (HydatState.currentHydat === undefined) {
    throw new Error('currentHydat is undefined');
  }
  storage.setItem(HydatState.currentHydat.name, JSON.stringify(HydatState.settingsForCurrentHydat));
}

export function loadHydatSettingsFromStorage(hydatName: string) {
  return storage.getItem(hydatName);
}
