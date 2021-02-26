import { graphState, update2DMode, renderGraph } from './graph';
import { initDatGUIState } from './datGUI';
import { NewUI } from './newUI';
import { PlotSettingsControl } from './plotSettings';
import { initDOMState } from './dom';
import { initEditorState } from './editor';
import { initStorage, loadHydlaFromStorage, loadHydatFromStorage } from './storage';
import { initHydatState } from './hydat';
import { initHyLaGIControllerState } from './hylagi';
import { initExample } from './example';
import { setBackgroundColor } from './plot';

$(document).ready(() => {
  const savedHydla = loadHydlaFromStorage();
  const savedHydat = loadHydatFromStorage();

  initExample();

  PlotSettingsControl.init();

  initDatGUIState(PlotSettingsControl.plotSettings);

  initHydatState(savedHydat);
  initHyLaGIControllerState();

  NewUI.init(graphState.controls);
  initDOMState();

  initEditorState(savedHydla);
  initStorage();

  update2DMode(PlotSettingsControl.plotSettings.twoDimensional);
  PlotSettingsControl.timeStop();

  if (PlotSettingsControl.plotSettings.backgroundColor !== undefined) {
    setBackgroundColor(PlotSettingsControl.plotSettings.backgroundColor);
  }

  renderGraph();
});
