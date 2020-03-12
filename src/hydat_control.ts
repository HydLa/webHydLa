export class HydatControl{
  static current_hydat:Hydat;
  static settingsForCurrentHydat = {};

  static init(saved_hydat:string) {
    if (saved_hydat) {
      this.loadHydat(JSON.parse(saved_hydat));
    }
  }
  
  static loadHydat(hydat:HydatRaw) {
    try {
      this.browser_storage.setItem("hydat", JSON.stringify(hydat));
      this.current_hydat = new Hydat(hydat);
      parameter_setting(this.current_hydat.parameters);
      modifyNameLabel(this.current_hydat.name);
    }
    catch (e) {
      console.log(e);
      console.log(e.stack);
      DOMControl.showToast("Failed to load hydat: " + e.name + "(" + e.message + ")", 3000, "red darken-4");
    }
    this.graph.clearPlot();
    this.initVariableSelector(hydat);
    update_axes(true);
  }
}
