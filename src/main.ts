import { GraphControl } from './graph_control';
import { DatGUIControl } from './dat_gui_control';
import { NewUI } from './new_ui';
import { PlotSettingsControl } from './plot_settings';
import { init as DOMControl_init } from './dom_control';
import { EditorControl } from './editor_control';
import { StorageControl } from './storage_control';
import { PlotLineMapControl } from './plot_line_map_control';
import { PlotControl } from './plot_control';
import { HydatControl } from './hydat_control';
import { HyLaGIController } from './hylagi';
import { ExampleLoader } from './example_loader';

$(document).ready(() => {
  const saved_hydla = StorageControl.loadHydla();
  const saved_hydat = StorageControl.loadHydat();

  ExampleLoader.init();

  PlotSettingsControl.init();
  GraphControl.init();

  PlotControl.init(PlotSettingsControl.plot_settings);
  DatGUIControl.init(PlotSettingsControl.plot_settings);

  HydatControl.init(saved_hydat);
  HyLaGIController.init();

  PlotLineMapControl.init();
  NewUI.init(GraphControl.controls);
  DOMControl_init();

  EditorControl.init(saved_hydla);
  StorageControl.init();

  GraphControl.update2DMode(PlotSettingsControl.plot_settings.twoDimensional);
  PlotSettingsControl.time_stop();

  if (PlotControl.plot_settings.backgroundColor !== undefined) {
    PlotControl.setBackgroundColor(PlotControl.plot_settings.backgroundColor);
  }

  GraphControl.render();
});
