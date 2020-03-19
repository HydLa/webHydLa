import { GraphControl } from "./graph_control";
import { DatGUIControl } from "./dat_gui_control";
import { NewUI } from "./new_ui";
import { PlotSettingsControl } from "./plot_settings";
import { DOMControl } from "./dom_control";
import { EditorControl } from "./editor_control";
import { StorageControl } from "./storage_control";
import { PlotLineMapControl } from "./plot_line_map_control";
import { PlotControl } from "./plot_control";
import { HydatControl } from "./hydat_control";

$(document).ready(() => {
  GraphControl.init();
  PlotLineMapControl.init();
  NewUI.init(GraphControl.controls);
  DOMControl.init();
  const saved_hydla = StorageControl.loadHydla();
  const saved_hydat = StorageControl.loadHydat();
  
  EditorControl.init(saved_hydla);
  StorageControl.init();
  
  PlotSettingsControl.init();
  DatGUIControl.init(PlotSettingsControl.plot_settings);
  PlotControl.init(PlotSettingsControl.plot_settings);
  
  HydatControl.init(saved_hydat);
  
  GraphControl.update2DMode(PlotSettingsControl.plot_settings.twoDimensional);
  PlotSettingsControl.time_stop();
  
  GraphControl.render();
});





// function onExecButtonClick() {
//   if (hylagi_running) {
//     killHyLaGI();
//   }
//   else {
//     EditorControl.sendHydLa();
//   }
// }

// function getErrorMessage(sid) {
//   var form = document.createElement("form");
//   form.action = "error.cgi";
//   form.method = "post";
//   var id = document.createElement("input");
//   id.type = "hidden";
//   id.name = "sid";
//   id.value = sid;
//   // document.getElementById("graph").contentDocument.body.appendChild(form); // ???
//   form.appendChild(id);
//   form.submit();
// }



/* function to enable/disable input field */
// function connecttext(elemID, ischeckded) {
//   var elm = document.getElementById(elemID);
//   if (ischeckded == true) {
//     elm.disabled = false;
//     elm.classList.remove("hide");
//   } else {
//     elm.disabled = true;
//     elm.classList.add("hide");
//   }
// }
