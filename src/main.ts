import * as ace from "ace-builds";
import $ from 'jquery';
import Materialize from "materialize-css";
import "ace-builds/src-noconflict/theme-sqlserver"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-clouds"
import "ace-builds/src-noconflict/keybinding-emacs"
import "ace-builds/src-noconflict/keybinding-vim"
import * as dat from "dat.gui";
import { Graph } from "./three_init";
import { plot_lines } from "./plot_line";

const html_mode_check_box = <HTMLInputElement>document.getElementById("html_mode_check_box")

/* ID="editor" な div をエディタにする */
let editor = ace.edit("editor");

/* 諸々の設定 */
editor.setTheme("ace/theme/sqlserver");
editor.getSession().setMode("ace/mode/hydla")
editor.getSession().setTabSize(4);
editor.getSession().setUseSoftTabs(true);
editor.setHighlightActiveLine(false);
// editor.$blockScrolling = Infinity;
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true,
  fontSize: "12pt",
});

/* set keybinding */
editor.commands.addCommand({
  name: "runHyLaGI",
  bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
  exec: function (editor) { sendHydLa(); },
  readOnly: true
});

export let dat_gui_parameter_folder: dat.GUI;
export let dat_gui_variable_folder: dat.GUI;
export let dat_gui_parameter_folder_seek: dat.GUI;

let first_script_element: HTMLScriptElement;
let dynamic_script_elements: HTMLScriptElement[] = [];

export let plot_settings: PlotSettings;
export let graph = new Graph();

$(document).ready(function () {

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
    .onChange((_) => { replot_all(); savePlotSettings(); });
  dat_gui
    .add(plot_settings, 'lineWidth', 1, 10)
    .step(1)
    .name('line width')
    .onChange((_) => { replot_all(); savePlotSettings(); });
  dat_gui
    .add(plot_settings, 'scaleLabelVisible')
    .name("show scale label")
    .onChange((_) => { update_axes(true); savePlotSettings(); });
  dat_gui
    .add(plot_settings, 'twoDimensional')
    .name("XY-mode")
    .onChange((_) => { update2DMode(); savePlotSettings(); });
  dat_gui
    .add(plot_settings, 'autoRotate')
    .name("auto rotate")
    .onChange((_) => { updateRotate(); savePlotSettings(); });
  dat_gui
    .addColor(plot_settings, 'backgroundColor')
    .name('background')
    .onChange((value) => { setBackgroundColor(value); savePlotSettings();/*render_three_js();i*/ });
  dat_gui_animate
    .add(plot_settings, 'animate')
    .name("stop")
    .onChange((_) => { time_stop(); savePlotSettings(); });
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
});

$(window).resize(function () {
  graph.resizeGraphRenderer();
});

function time_stop() {
  graph.animatable = !plot_settings.animate;
}

function seek() {
  //if(plot_settings.animate)
  {
    graph.time = plot_settings.seek;
    animate();
  }
}

function updateRotate() {
  graph.controls.autoRotate = plot_settings.autoRotate;
}

function update2DMode() {
  graph.controls.enableRotate = !plot_settings.twoDimensional;
  if (plot_settings.twoDimensional) {
    graph.camera.position.copy(graph.controls_position0.clone());
    graph.controls.target.set(0, 0, 0);
    graph.camera.updateMatrix(); // make sure camera's local matrix is updated
    graph.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  }
}

export function fixLayoutOfDatGUI() {
  // to avoid layout collapsion of dat gui
  var dg_c_inputs = $('.dg .c input[type=text]');
  for (var i = 0; i < dg_c_inputs.length; i++) {
    dg_c_inputs[i].style.height = '100%';
  }

  var selectors = $('.selector');
  for (var i = 0; i < selectors.length; i++) {
    selectors[i].style.width = '100%';
  }
}

function savePlotSettings() {
  browser_storage.setItem("plot_settings", JSON.stringify(plot_settings));
}


/* set default hydla code */
var default_hydla =
  //"// a sample hydla code: bouncing_particle.hydla\n\
  "// a sample hydla code: bouncing_particle.hydla\n\
\n\
INIT <=> y = 10 & y' = 0.\n\
FALL <=> [](y'' = -10).\n\
BOUNCE <=> [](y- = 0 => y' = -4/5 * y'-).\n\
\n\
INIT, FALL << BOUNCE.\n\
\n\
// #hylagi -p 10\n\
";

/* load saved hydla code if it exist */
var browser_storage = localStorage;
var saved_hydla = browser_storage.getItem("hydla");
var saved_hydat = browser_storage.getItem("hydat");
if (saved_hydla) {
  editor.setValue(saved_hydla);
} else {
  browser_storage.setItem("hydla_name", "bouncing_ball");
  editor.setValue(default_hydla);
}

var hylagi_running = false;

function onExecButtonClick() {
  if (hylagi_running) {
    killHyLaGI();
  }
  else {
    sendHydLa();
  }
}

function updateExecIcon() {
  let run_button = <HTMLInputElement>document.getElementById('run_button');
  if (hylagi_running) {
    run_button.value = "KILL"; // for new UI
    var elist = document.getElementsByClassName("exec-icon");
    for (var i = 0; i < elist.length; ++i) {
      elist[i].classList.remove("mdi-content-send");
      elist[i].classList.add("mdi-content-clear");
    }
  }
  else {
    run_button.value = "RUN"; // for new UI
    var elist = document.getElementsByClassName("exec-icon");
    for (var i = 0; i < elist.length; ++i) {
      elist[i].classList.add("mdi-content-send");
      elist[i].classList.remove("mdi-content-clear");
    }
  }
}

/* function to submit hydla code to server */
function sendHydLa() {
  startPreloader();
  hylagi_running = true;
  updateExecIcon();

  var hr = new XMLHttpRequest();
  hr.open("GET", "start_session");
  hr.send(null);

  hr.onload = function (progress_ev) {
    /* build form data */
    var form = new FormData();
    form.append("hydla_code", editor.getValue());
    var options_value = "";
    let phase_num = <HTMLInputElement>document.getElementById("phase_num");
    let simulation_time = <HTMLInputElement>document.getElementById("simulation_time");
    let nd_mode_check_box = <HTMLInputElement>document.getElementById("nd_mode_check_box");
    let other_options = <HTMLInputElement>document.getElementById("other_options");
    let timeout_option = <HTMLInputElement>document.getElementById("timeout_option");
    if (phase_num.value != "") options_value += " -p " + phase_num.value;
    if (simulation_time.value != "") options_value += " -t " + simulation_time.value;
    if (phase_num.value == "" && simulation_time.value == "") options_value += " -p10";
    if (html_mode_check_box.checked) options_value += " -d --fhtml ";
    if (nd_mode_check_box.checked) options_value += " --fnd ";
    else options_value += " --fno-nd ";
    if (other_options.value != "") options_value += other_options.value;
    form.append("hylagi_option", options_value);
    var timeout_value = "";
    if (timeout_option.value != "") timeout_value = timeout_option.value;
    else timeout_value = "30";
    form.append("timeout_option", timeout_value);
    var xmlhr = new XMLHttpRequest();
    xmlhr.open("POST", "hydat.cgi");
    xmlhr.send(form);
    xmlhr.onload = function (ev) {
      var response = JSON.parse(xmlhr.responseText);

      switch (response.error) {
        case 0:
          Materialize.toast({ html: "Simulation was successful.", displayLength: 1000 });
          if (response.hydat != undefined) {
            response.hydat.name = browser_storage.getItem("hydla_name");
            loadHydat(response.hydat);
          }
          else {
            $('ul.tabs').tabs('select', 'output-area');
          }
          break;
        default:
          if (hylagi_running) {
            Materialize.toast({
              html: "Error message: " + response.message,
              displayLength: 3000,
              classes: "red darken-4"
            });
            $('ul.tabs').tabs('select', 'output-area');
          }
          else {
            Materialize.toast({ html: "Killed HyLaGI", displayLength: 1000 });
          }
          break;
      }
      let server_response = response;
      var output = document.getElementById("output-initial");
      output.innerHTML = "";
      for (var si = 0; si < dynamic_script_elements.length; si++) {
        dynamic_script_elements[si].parentNode.removeChild(dynamic_script_elements[si]);
      }
      dynamic_script_elements = [];
      if (html_mode_check_box.checked) {
        if (response.stdout != undefined) {
          output.innerHTML += response.stdout;
        }
        if (response.stderr != undefined) {
          output.innerHTML += response.stderr;
        }
        let scriptNodes = output.getElementsByTagName("script");
        for (var si = 0; si < scriptNodes.length; si++) {
          if (scriptNodes[si].hasAttribute("src")) {
            continue;
          }
          var newScript = document.createElement("script");
          newScript.innerHTML = scriptNodes[si].innerHTML;
          dynamic_script_elements.push(first_script_element.parentNode.insertBefore(newScript, first_script_element));
        }
      }
      else {
        if (response.stdout != undefined) {
          output.innerHTML += getEscapedStringForHTML(response.stdout);
        }
        if (response.stderr != undefined) {
          output.innerHTML += getEscapedStringForHTML(response.stderr);
        }
      }
      stopPreloader();
      hylagi_running = false;
      updateExecIcon();
    };
  };
}

function getEscapedStringForHTML(orig_string) {
  return orig_string.replace(/\n/mg, "<br/>").replace(/\s/mg, "&nbsp;");
}

function killHyLaGI() {
  /* build form data */
  var xmlhr = new XMLHttpRequest();
  xmlhr.open("GET", "killer");
  xmlhr.send(null);
  hylagi_running = false;
  updateExecIcon();
}

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

/* function to start preloader */
function startPreloader() {
  document.getElementById("graph-preloader").classList.remove("hide");
  document.getElementById("output-preloader").classList.remove("hide");
}

/* function called when graph is drawn */
function stopPreloader() {
  document.getElementById("graph-preloader").classList.add("hide");
  document.getElementById("output-preloader").classList.add("hide");
}


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


var resizeLoopCount;

function startResizingGraphArea() {
  resizeLoopCount = 0;
  setTimeout("resizeGraphArea()", 10);
}

function resizeGraphArea() {
  resizeLoopCount++;
  graph.resizeGraphRenderer();
  //TODO: do this without timer
  if (resizeLoopCount < 80) setTimeout("resizeGraphArea()", 10);
}

/* function to close/open input-pane */
(function () {
  var initial_x, initial_width, initial_editor, initial_left, dragging = false;

  function v_separator_mousedown_handler(e) {
    initial_x = e.pageX;
    initial_width = $("#left-pane").width();
    initial_left = $("#v-separator").css("left");
    initial_editor = $("#editor").width();
    dragging = true;
    $("<div id='secretdiv'>")
      .css({
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: "100%",
        zIndex: 100000
      })
      .appendTo("body")
      .mousemove(v_separator_mousemove_handler)
      .mouseup(v_separator_mouseup_handler)
  }

  function v_separator_mousemove_handler(e) {
    if (!dragging) return;
    var diff = e.pageX - initial_x;
    $("#left-pane").width(initial_width + diff);
    $("#editor").width(initial_editor + diff);
    resizeGraphArea();
    editor.resize();
  }

  function v_separator_mouseup_handler(e) {
    dragging = false;
    $("#secretdiv").remove();
  }

  $("#v-separator")
    .mousedown(v_separator_mousedown_handler)
})();


/* function to adjust height of graph-setting-area */
(function () {
  var initial_y, initial_height,
    dragging = false;

  function h_separator_mousedown_handler(e) {
    initial_y = e.pageY;
    initial_height = $("#input-pane").height();
    dragging = true;
    $("<div id='secretdiv'>")
      .css({
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: "100%",
        zIndex: 100000
      })
      .appendTo("body")
      .mousemove(h_separator_mousemove_handler)
      .mouseup(h_separator_mouseup_handler)
  }

  function h_separator_mousemove_handler(e) {
    if (!dragging) return;
    var diff = e.pageY - initial_y;
    $("#input-pane").height(initial_height + diff);
    $("#editor").height(initial_height + diff);
    editor.resize();
  }

  function h_separator_mouseup_handler(e) {
    dragging = false;
    $("#secretdiv").remove();
  }

  $("#h-separator")
    .mousedown(h_separator_mousedown_handler)
})();

function toggleInputPane() {
  var elm = document.getElementById("left-pane");
  var tgl = document.getElementById("v-toggle-icon");
  if (elm.getAttribute("style")) {
    elm.removeAttribute("style");
    tgl.classList.remove("mdi-navigation-chevron-right");
    tgl.classList.add("mdi-navigation-chevron-left");
  } else {
    elm.style.width = "0px";
    tgl.classList.remove("mdi-navigation-chevron-left");
    tgl.classList.add("mdi-navigation-chevron-right");
  }
  startResizingGraphArea();
}


/* function to save HydLa file */
function saveHydla() {
  var blob = new Blob([editor.getValue()])
  var object = window.URL.createObjectURL(blob);
  var d = new Date();
  var date = d.getFullYear() + "-" + d.getMonth() + 1 + "-" + d.getDate() + "T" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
  var a = document.createElement("a");
  a.href = object;
  a.download = date + ".hydla";
  var event = document.createEvent("MouseEvents");
  event.initMouseEvent(
    "click", true, false, window, 0, 0, 0, 0, 0
    , false, false, false, false, 0, null
  );
  a.dispatchEvent(event);
}

function loadFile() {
  var i = document.createElement("input");
  i.type = "file";
  var event = document.createEvent("MouseEvents");
  event.initMouseEvent(
    "click", true, false, window, 0, 0, 0, 0, 0
    , false, false, false, false, 0, null
  );
  i.addEventListener("change", (_) => {
    var input_file = i.files[0];
    var fr = new FileReader();
    fr.readAsText(input_file);
    var splitted_strs = input_file.name.split(".");
    var ext = splitted_strs[splitted_strs.length - 1].toLowerCase();
    if (ext == "hydat") {
      fr.onload = (_) => {
        loadHydat(JSON.parse(<string>fr.result));
      };
    }
    else {
      browser_storage.setItem("hydla_name", input_file.name);
      fr.onload = (_) => {
        editor.setValue(<string>fr.result);
      };
    }
  }, false);
  i.dispatchEvent(event);
}

/* function to save Hydat file */
function saveHydat() {
  var blob = new Blob([JSON.stringify(current_hydat)]);
  var object = window.URL.createObjectURL(blob);
  var d = new Date();
  var date = d.getFullYear() + "-" + d.getMonth() + 1 + "-" + d.getDate() + "T" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
  var a = document.createElement("a");
  a.href = object;
  a.download = date + ".hydat";
  var event = document.createEvent("MouseEvents");
  event.initMouseEvent(
    "click", true, false, window, 0, 0, 0, 0, 0
    , false, false, false, false, 0, null
  );
  a.dispatchEvent(event);
}

/* function to save HydLa code into Web Storage */
function saveHydlaToWebstorage() {
  autosave_event_enabled = false;
  autosave_changed = false;
  browser_storage.setItem("hydla", editor.getValue());
  Materialize.toast({ html: "Saved", displayLength: 1000 });
  setTimeout(function () {
    if (autosave_changed) {
      saveHydlaToWebstorage();
    } else {
      autosave_event_enabled = true;
    }
  }, 5000);
}

let autosave_event_enabled = true;
let autosave_changed = false;
editor.on("change", function (e) {
  if (autosave_event_enabled) {
    saveHydlaToWebstorage();
  } else {
    autosave_changed = true;
  }
});

let key_binding_selector = <HTMLSelectElement>document.getElementById("key_binding_selector");

/* function to save editor into Web Storage */
function saveKeyBindingToWebstorage() {
  var bind_selector = key_binding_selector.value;
  browser_storage.setItem("key_binding", bind_selector);
}

function loadKeyBindingFromWebstorage() {
  var key_binding_setting = browser_storage.getItem("key_binding");
  if (key_binding_setting != undefined) {
    key_binding_selector.value = browser_storage.getItem("key_binding");
  }
  else {
    key_binding_selector.value = key_binding_selector.options[key_binding_selector.selectedIndex].value;
    browser_storage.setItem("key_binding", key_binding_selector.value);
  }
  if (key_binding_selector.value == "") editor.setKeyboardHandler(null);
  else editor.setKeyboardHandler(key_binding_selector.value);
}

let theme_selector = <HTMLSelectElement>document.getElementById("theme_selector");

/* function to save theme into Web Storage */
function saveThemeToWebstorage() {
  var theme = theme_selector.value;
  browser_storage.setItem("theme", theme);
}

function loadThemeFromWebstorage() {
  var theme_setting = browser_storage.getItem("theme");
  if (theme_setting != undefined) {
    theme_selector.value = browser_storage.getItem("theme");
  } else {
    browser_storage.setItem("theme", theme_selector.value);
  }
  editor.setTheme("ace/theme/" + theme_selector.value);
}

let settingsForCurrentHydat = {};
/* function to update variable selector for graph */
function initVariableSelector(hydat) {
  plot_lines.removeAllFolders();

  plot_lines.reset();

  //var guard_list ={x:["x", "xSWON"]};

  let stringForCurrentHydat = browser_storage.getItem(hydat.name);
  if (stringForCurrentHydat != null) {
    settingsForCurrentHydat = JSON.parse(stringForCurrentHydat);
    var line_settings = settingsForCurrentHydat.plot_line_settings;
    for (var i in line_settings) {
      let line = plot_lines.addNewLineWithIndex(line_settings[i].x, line_settings[i].y, line_settings[i].z, i);
      /*for(key in guard_list){
        if(line_settings[i].x == key){
          for(var l in guard_list.x){
            addNewLineWithIndexGuard(guard_list.x[l], "x'", "0", i+l);
          }
        }
      }*/
      if (line.settings.x != "" || line.settings.y != "" || line.settings.z != "") line.folder.open();
    }
    replot_all();
  }

  if (plot_lines.getLength() == 0) {
    settingsForCurrentHydat = { plot_line_settings: {} };
    let first_line = plot_lines.addNewLine("t", current_hydat != undefined ? current_hydat.variables[0] : "", "0");
    first_line.color_angle = 0;
    replot(first_line);
    first_line.folder.open();
  }

  dat_gui_variable_folder.open();
}

//TODO: implement this in more elegant way
setTimeout(() => { graph.resizeGraphRenderer() }, 200);

function showToast(message: string, duration: number, classes: string) {
  Materialize.toast({ html: message, displayLength: duration, classes: classes });
  let toast_container = document.getElementById("toast-container");
  const MAX_CHILDREN_NUM = 5;
  if (toast_container.children.length > MAX_CHILDREN_NUM) {
    for (let i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++) {
      toast_container.removeChild(toast_container.children[i]);
    }
  }
}

// below are functions added for new UI

var in_graph_area;
$('#graph-area').hover(
  () => { in_graph_area = true; },
  function () { in_graph_area = false; $('#scroll-message').css("opacity", "0"); }
);

var timeout;
$("body").scroll(function () {
  clearTimeout(timeout);
  if (in_graph_area == true) {
    $('#scroll-message').css("opacity", "0.65");
    timeout = setTimeout(function () { $('#scroll-message').css("opacity", "0"); }, 1150);
  }
});

const key_shift = 16;
const key_ctr = 17;
const key_alt = 18;
const key_meta_l = 91;

document.addEventListener("keydown", (e) => {
  if (!e) return;
  if (e.keyCode === key_shift || e.keyCode === key_ctr || e.keyCode === key_alt || e.keyCode === key_meta_l) {
    enableZoom(); $('#scroll-message').css("opacity", "0");
  }
});

document.addEventListener("keyup", (e) => {
  if (!e) return;
  if (e.keyCode === key_shift || e.keyCode === key_ctr || e.keyCode === key_alt || e.keyCode === key_meta_l) {
    disableZoom();
  }
});

function isClassicUI() {
  let elem = <HTMLInputElement>document.getElementById("classic_ui_flag");
  return elem.value === "true"
}


function enableZoom() {
  if (isClassicUI()) return;
  graph.controls.enableZoom = true;
  $('body').css("overflow-y", "hidden");
}
function disableZoom() {
  if (isClassicUI()) return;
  graph.controls.enableZoom = false;
  $('body').css("overflow-y", "visible");
}
function initScrollZoom() {
  disableZoom();
}
