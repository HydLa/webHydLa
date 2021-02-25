import { graphControl, update2DMode, renderGraph } from './graph_control';
import { DatGUIControl } from './dat_gui_control';
import { NewUI } from './new_ui';
import { PlotSettingsControl } from './plot_settings';
import { initDOMState } from './dom_control';
import { initEditorState } from './editor_control';
import { initStorageControl, loadHydlaFromStorage, loadHydatFromStorage } from './storage_control';
import { initPlotLineMapControl } from './plot_line_map_control';
import { initHydatControl } from './hydat_control';
import { initHyLaGIControllerState } from './hylagi';
import { initExampleLoader } from './example_loader';
import { setBackgroundColor } from './plot_control';

$(document).ready(() => {
  const saved_hydla = loadHydlaFromStorage();
  const saved_hydat = loadHydatFromStorage();

  initExampleLoader();

  PlotSettingsControl.init();

  DatGUIControl.init(PlotSettingsControl.plot_settings);

  initHydatControl(saved_hydat);
  initHyLaGIControllerState();

  initPlotLineMapControl();
  NewUI.init(graphControl.controls);
  initDOMState();

  initEditorState(saved_hydla);
  initStorageControl();

  update2DMode(PlotSettingsControl.plot_settings.twoDimensional);
  PlotSettingsControl.time_stop();

  if (PlotSettingsControl.plot_settings.backgroundColor !== undefined) {
    setBackgroundColor(PlotSettingsControl.plot_settings.backgroundColor);
  }

  renderGraph();
});
