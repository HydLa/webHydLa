import { PlotSettings, PlotSettingsControl } from './plot_settings';
import { HydatRaw } from './hydat';
import { setEditorKeyBinding, setEditorTheme } from './editor_control';
import { HydatControl } from './hydat_control';

const storage = localStorage;

const theme_selector = <HTMLSelectElement>document.getElementById('theme_selector');
const key_binding_selector = <HTMLSelectElement>document.getElementById('key_binding_selector');

export function initStorageControl() {
  loadThemeFromStorage();
  loadKeyBindingFromStorage();
}

export function saveKeyBindingToStorage() {
  const bind_selector = key_binding_selector.value;
  storage.setItem('key_binding', bind_selector);
}

export function loadKeyBindingFromStorage() {
  const key_binding_setting = storage.getItem('key_binding');
  if (key_binding_setting !== null) {
    key_binding_selector.value = key_binding_setting;
  } else {
    key_binding_selector.value = key_binding_selector.options[key_binding_selector.selectedIndex].value;
    storage.setItem('key_binding', key_binding_selector.value);
  }
  if (key_binding_selector.value == '') setEditorKeyBinding(null);
  else setEditorKeyBinding(key_binding_selector.value);
}

/* function to save theme into Web Storage */
export function saveThemeToStorage() {
  const theme = theme_selector.value;
  storage.setItem('theme', theme);
}

export function loadThemeFromStorage() {
  const theme_setting = storage.getItem('theme');
  if (theme_setting !== null) {
    theme_selector.value = theme_setting;
  } else {
    storage.setItem('theme', theme_selector.value);
  }
  setEditorTheme(theme_selector.value);
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

export function savePlotSettingsToStorage(plot_settings: PlotSettings) {
  storage.setItem('plot_settings', JSON.stringify(plot_settings));
}

export function loadPlotSettingsFromStorage() {
  return PlotSettingsControl.parseJSON(storage.getItem('plot_settings'));
}

export function saveHydlaNameToStorage(hydla_name: string) {
  storage.setItem('hydla_name', hydla_name);
}

export function loadHydlaNameFromStorage() {
  return storage.getItem('hydla_name');
}

export function saveHydatSettingsToStorage() {
  if (HydatControl.current_hydat === undefined) {
    throw new Error('current_hydat is undefined');
  }
  storage.setItem(HydatControl.current_hydat.name, JSON.stringify(HydatControl.settingsForCurrentHydat));
}

export function loadHydatSettingsFromStorage(hydat_name: string) {
  return storage.getItem(hydat_name);
}
