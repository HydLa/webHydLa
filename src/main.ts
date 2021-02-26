import { graphControl, update2DMode, renderGraph } from './graphControl';
import { initDatGUIState } from './datGUIControl';
import { NewUI } from './newUI';
import { PlotSettingsControl } from './plotSettings';
import { initDOMState } from './domControl';
import { initEditorState } from './editorControl';
import { initStorageControl, loadHydlaFromStorage, loadHydatFromStorage } from './storageControl';
import { initHydatControl } from './hydatControl';
import { initHyLaGIControllerState } from './hylagi';
import { initExampleLoader } from './exampleLoader';
import { setBackgroundColor } from './plotControl';

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
