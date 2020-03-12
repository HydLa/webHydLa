import { PlotSettings, PlotSettingsControl } from "./plot_settings";
import { HydatRaw } from "./hydat";
import { EditorControl } from "./editor_control";

const storage = localStorage;

const theme_selector = <HTMLSelectElement>document.getElementById("theme_selector");
const key_binding_selector = <HTMLSelectElement>document.getElementById("key_binding_selector");

export class StorageControl{
  static init() {
    this.loadTheme();
    this.loadKeyBinding();
  }

  /* function to save editor into Web Storage */
  static saveKeyBinding() {
    var bind_selector = key_binding_selector.value;
    storage.setItem("key_binding", bind_selector);
  }

  static loadKeyBinding() {
    var key_binding_setting = storage.getItem("key_binding");
    if (key_binding_setting != undefined) {
      key_binding_selector.value = storage.getItem("key_binding");
    }
    else {
      key_binding_selector.value = key_binding_selector.options[key_binding_selector.selectedIndex].value;
      storage.setItem("key_binding", key_binding_selector.value);
    }
    if (key_binding_selector.value == "") EditorControl.setKeyBinding(null);
    else EditorControl.setKeyBinding(key_binding_selector.value);
  }

  /* function to save theme into Web Storage */
  static saveTheme() {
    var theme = theme_selector.value;
    storage.setItem("theme", theme);
  }

  static loadTheme() {
    var theme_setting = storage.getItem("theme");
    if (theme_setting != undefined) {
      theme_selector.value = storage.getItem("theme");
    } else {
      storage.setItem("theme", theme_selector.value);
    }
    EditorControl.setTheme(theme_selector.value);
  }

  /* function to save HydLa code into Web Storage */
  static saveHydla(hydla:string) {
    storage.setItem("hydla", hydla);
  }

  static loadHydla() {
    return storage.getItem("hydla");
  }

  static saveHydat(hydat:HydatRaw) {
    storage.setItem("hydat", JSON.stringify(hydat));
  }

  static loadHydat() {
    return storage.getItem("hydat");
  }

  static savePlotSettings(plot_settings:PlotSettings) {
    storage.setItem("plot_settings", JSON.stringify(plot_settings));
  }

  static loadPlotSettings() {
    return PlotSettingsControl.parseJSON(storage.getItem("plot_settings"));
  }
}
