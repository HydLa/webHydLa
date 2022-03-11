import { graphState, update2DMode, renderGraph } from './graph/graph';
import { initDatGUIState } from './graph/datGUI';
import { PlotSettingsControl } from './graph/plotSettings';
import { setBackgroundColor } from './graph/plot';
import { initDOMState } from './UI/dom';
import { NewUI } from './UI/newUI';
import { initEditorState } from './editor/editor';
import { initHyLaGIControllerState } from './editor/hylagi';
import { initExample } from './editor/example';
import { initHydatState } from './hydat/hydat';
import { initStorage, loadHydlaFromStorage, loadHydatFromStorage } from './storage';

$(() => {
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
