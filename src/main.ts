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

document.addEventListener('DOMContentLoaded', () => {
  const savedHydla = loadHydlaFromStorage();
  const savedHydat = loadHydatFromStorage();

  document.documentElement.setAttribute('theme', 'dark');
  initExample();

  PlotSettingsControl.init();

  initDatGUIState(PlotSettingsControl.plotSettings);

  initHydatState(savedHydat);
  initHyLaGIControllerState();

  NewUI.init(graphState.controls);

  initEditorState(savedHydla);
  initStorage();
  initDOMState();

  update2DMode(PlotSettingsControl.plotSettings.twoDimensional);
  PlotSettingsControl.timeStop();

  if (PlotSettingsControl.plotSettings.backgroundColor !== undefined) {
    setBackgroundColor(PlotSettingsControl.plotSettings.backgroundColor);
  }

  renderGraph();
});
