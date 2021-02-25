import { PlotSettings, PlotSettingsControl } from './plot_settings';
import { HydatRaw } from './hydat';
import { setEditorKeyBinding, setEditorTheme } from './editor_control';
import { HydatControl } from './hydat_control';

const storage = localStorage;

const themeSelector = <HTMLSelectElement>document.getElementById('themeSelector');
const keyBindingSelector = <HTMLSelectElement>document.getElementById('keyBindingSelector');

export function initStorageControl() {
  loadThemeFromStorage();
  loadKeyBindingFromStorage();
}

export function saveKeyBindingToStorage() {
  const bindSelector = keyBindingSelector.value;
  storage.setItem('keyBinding', bindSelector);
}

export function loadKeyBindingFromStorage() {
  const keyBindingSetting = storage.getItem('keyBinding');
  if (keyBindingSetting !== null) {
    keyBindingSelector.value = keyBindingSetting;
  } else {
    keyBindingSelector.value = keyBindingSelector.options[keyBindingSelector.selectedIndex].value;
    storage.setItem('keyBinding', keyBindingSelector.value);
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
  storage.setItem('plotSettings', JSON.stringify(plotSettings));
}

export function loadPlotSettingsFromStorage() {
  return PlotSettingsControl.parseJSON(storage.getItem('plotSettings'));
}

export function saveHydlaNameToStorage(hydlaName: string) {
  storage.setItem('hydlaName', hydlaName);
}

export function loadHydlaNameFromStorage() {
  return storage.getItem('hydlaName');
}

export function saveHydatSettingsToStorage() {
  if (HydatControl.currentHydat === undefined) {
    throw new Error('currentHydat is undefined');
  }
  storage.setItem(HydatControl.currentHydat.name, JSON.stringify(HydatControl.settingsForCurrentHydat));
}

export function loadHydatSettingsFromStorage(hydatName: string) {
  return storage.getItem(hydatName);
}
