import { Graph } from "./three_init";
import { PlotLineMap } from "./plot_line";
import { DatGUIControl } from "./graph_axis";

export class CommonData {
  plot_settings: PlotSettings;
  graph = new Graph();
  plot_lines = new PlotLineMap();
  dat_gui_control: DatGUIControl;

  constructor() {
    initScrollZoom();

    editor.clearSelection();
    /* initialize materialize components */
    $('#file-dropdown-button').dropdown({
      constrainWidth: true,
      hover: false,
    });
    $('.axis-dropdown-button').dropdown({
      constrainWidth: false,
      hover: false
    });
    $('.modal-trigger').modal();
    $('ui.tabs').tabs();

    $("fix_button").on('change', function () {
      replot_all();
    });
    $("step_button").on('change', function () {
      replot_all();
    });

    loadThemeFromWebstorage();
    loadKeyBindingFromWebstorage();
    $('select').formSelect();

    first_script_element = document.getElementsByTagName('script')[0];

    this.plot_settings = PlotSettings.parseJSON(browser_storage.getItem('plot_settings'));
    // var controler;
    this.dat_gui_control = new DatGUIControl();

    if (saved_hydat) {
      loadHydat(JSON.parse(saved_hydat));
    }

    if (plot_settings.backgroundColor != undefined) {
      setBackgroundColor(plot_settings.backgroundColor);
    }

    this.graph.update2DMode(this.plot_settings.twoDimensional);
    time_stop();

    graph.render();
  }
  time_stop() {
    this.graph.animatable = !this.plot_settings.animate;
  }
  seek() {
    //if(plot_settings.animate)
    this.graph.time = this.plot_settings.seek;
    this.graph.animate();
  }
  fixLayoutOfDatGUI() {
    this.dat_gui_control.fixLayout();
  }
  savePlotSettings() {
    browser_storage.setItem("plot_settings", JSON.stringify(plot_settings));
  }
}
