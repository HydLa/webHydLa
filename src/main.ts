import { graphControl, update2DMode, renderGraph } from './graph_control';
import { initDatGUIState } from './dat_gui_control';
import { NewUI } from './new_ui';
import { PlotSettingsControl } from './plot_settings';
import { initDOMState } from './dom_control';
import { initEditorState } from './editor_control';
import { initStorageControl, loadHydlaFromStorage, loadHydatFromStorage } from './storage_control';
import { initHydatControl } from './hydat_control';
import { initHyLaGIControllerState } from './hylagi';
import { initExampleLoader } from './example_loader';
import { setBackgroundColor } from './plot_control';

$(document).ready(() => {
  const savedHydla = loadHydlaFromStorage();
  const savedHydat = loadHydatFromStorage();

  initExampleLoader();

  PlotSettingsControl.init();

  initDatGUIState(PlotSettingsControl.plotSettings);

  initHydatControl(savedHydat);
  initHyLaGIControllerState();

  NewUI.init(graphControl.controls);
  initDOMState();

  initEditorState(savedHydla);
  initStorageControl();

  update2DMode(PlotSettingsControl.plotSettings.twoDimensional);
  PlotSettingsControl.timeStop();

  if (PlotSettingsControl.plotSettings.backgroundColor !== undefined) {
    setBackgroundColor(PlotSettingsControl.plotSettings.backgroundColor);
  }

  renderGraph();
});
