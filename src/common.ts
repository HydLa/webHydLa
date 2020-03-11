import { Graph } from "./three_init";
import { PlotLineMap } from "./plot_line";
import * as dat from "dat.gui";

export class CommonData {
  editor: ace.Ace.Editor;

  dat_gui_parameter_folder: dat.GUI;
  dat_gui_variable_folder: dat.GUI;
  dat_gui_parameter_folder_seek: dat.GUI;

  plot_settings: PlotSettings;
  graph = new Graph();
  plot_lines = new PlotLineMap();

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

    plot_settings = PlotSettings.parseJSON(browser_storage.getItem('plot_settings'));
    var add_line_obj = { add: function () { var line = addNewLine("", "", ""); line.folder.open(); } };
    // var controler;
    let dat_gui = new dat.GUI({ autoPlace: false, load: localStorage });
    let dat_gui_animate = new dat.GUI({ autoPlace: false, load: localStorage });
    dat_gui
      .add(plot_settings, 'plotInterval', 0.01, 1)
      .step(0.001)
      .name('plot interval')
      .onChange((_) => {
        replot_all();
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'lineWidth', 1, 10)
      .step(1)
      .name('line width')
      .onChange((_) => {
        replot_all();
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'scaleLabelVisible')
      .name("show scale label")
      .onChange((_) => {
        update_axes(true);
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'twoDimensional')
      .name("XY-mode")
      .onChange((_) => {
        this.graph.update2DMode(this.plot_settings.twoDimensional);
        savePlotSettings();
      });
    dat_gui
      .add(plot_settings, 'autoRotate')
      .name("auto rotate")
      .onChange((_) => {
        this.graph.updateRotate(this.plot_settings.autoRotate);
        savePlotSettings();
      });
    dat_gui
      .addColor(plot_settings, 'backgroundColor')
      .name('background')
      .onChange((value) => {
        setBackgroundColor(value);
        savePlotSettings();/*render_three_js();i*/
      });
    dat_gui_animate
      .add(plot_settings, 'animate')
      .name("stop")
      .onChange((_) => {
        time_stop();
        savePlotSettings();
      });
    //dat_gui_animate.add(plot_settings, 'seek', 0, 1000).step(1).name('seek').onChange(function(value){seek();savePlotSettings();});

    dat_gui.domElement.style['z-index'] = 2;
    dat_gui_animate.domElement.style['z-index'] = 3;
    dat_gui_animate.domElement.style['position'] = 'absolute';
    dat_gui_animate.domElement.style['bottom'] = '50px';
    //dat_gui_animate.domElement.style['margin'] = '0 auto';

    var height_area = $("#graph-area").css("height");
    //var width_area = $("#graph-area").css("width");

    dat_gui_parameter_folder = dat_gui.addFolder('parameters');
    dat_gui_parameter_folder_seek = dat_gui_animate.addFolder('seek');
    dat_gui.add(add_line_obj, 'add').name("add new line");
    dat_gui_variable_folder = dat_gui.addFolder('variables');

    var dat_container = document.getElementById('dat-gui');
    dat_container.appendChild(dat_gui.domElement);

    var dat_container_b = document.getElementById('dat-gui-bottom');
    dat_container_b.style.height = height_area;
    dat_container_b.appendChild(dat_gui_animate.domElement);

    let nd_mode_check_box = <HTMLInputElement>document.getElementById("nd_mode_check_box")
    nd_mode_check_box.checked = true;

    fixLayoutOfDatGUI();

    if (saved_hydat) {
      loadHydat(JSON.parse(saved_hydat));
    }


    if (plot_settings.backgroundColor != undefined) {
      setBackgroundColor(plot_settings.backgroundColor);
    }

    update2DMode();
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
}
