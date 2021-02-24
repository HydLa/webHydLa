import { graphControl, update2DMode, renderGraph } from './graph_control';
import { DatGUIControl } from './dat_gui_control';
import { NewUI } from './new_ui';
import { PlotSettingsControl } from './plot_settings';
import { initDOMState } from './dom_control';
import { initEditorState } from './editor_control';
import { StorageControl } from './storage_control';
import { PlotLineMapControl } from './plot_line_map_control';
import { PlotControl } from './plot_control';
import { initHydatControl } from './hydat_control';
import { HyLaGIController } from './hylagi';
import { initExampleLoader } from './example_loader';

$(document).ready(() => {
  const saved_hydla = StorageControl.loadHydla();
  const saved_hydat = StorageControl.loadHydat();

  initExampleLoader();

  PlotSettingsControl.init();

  PlotControl.init(PlotSettingsControl.plot_settings);
  DatGUIControl.init(PlotSettingsControl.plot_settings);

  initHydatControl(saved_hydat);
  HyLaGIController.init();

  PlotLineMapControl.init();
  NewUI.init(graphControl.controls);
  initDOMState();

  initEditorState(saved_hydla);
  StorageControl.init();

  update2DMode(PlotSettingsControl.plot_settings.twoDimensional);
  PlotSettingsControl.time_stop();

  if (PlotControl.plot_settings.backgroundColor !== undefined) {
    PlotControl.setBackgroundColor(PlotControl.plot_settings.backgroundColor);
  }

  renderGraph();
});
