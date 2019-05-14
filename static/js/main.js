// ロード時の処理
$(document).ready(function(){
  if (classic_ui == true) {return;}
  // スクロール動作でのズームをオフにする
  graph_controls.enableZoom = false;
  graph_controls.enableRotate = false;
  graph_controls.enablePan = true;
});

// カーソルがgraph-areaの中にあるか否かを追跡する変数
var in_graph_area;
$('#graph-area').hover( () => {
  in_graph_area=true;}, 
function() {
  in_graph_area=false;
  $('#scroll-message').css("opacity","0");
});
$("body").scroll(function() {
  if ((!classic_ui) & in_graph_area == true) {
    $('#scroll-message').css("opacity","0.65");
    setTimeout(function() {
      $('#scroll-message').css("opacity","0");
    }, 1500);
  }
});

function useClassicUI() {
  classic_ui = true;
  graph_controls.enableZoom   = true;
  graph_controls.enableRotate = false;
  graph_controls.enablePan    = true;
}

/* ID="editor" な div をエディタにする */
var editor = ace.edit("editor");

// checks if special keys are down
window.onkeydown = function (e) {
  if (!e) e = window.event;
  // スクロール動作でのズームをオンにする
  if ((!classic_ui) & (e.keyCode == 91 | e.keyCode == 16 | e.keyCode == 17)) {
    graph_controls.enableZoom   = true;
    graph_controls.enableRotate = false;
    graph_controls.enablePan    = true;
    $('#scroll-message-pane').css("opacity","0");
  }
}
window.onkeyup = function(e) {
  if (!e) e = window.event;
  // スクロール動作でのズームをオフにする
  if ((!classic_ui) & (e.keyCode == 91 | e.keyCode == 16 | e.keyCode == 17)) {
    graph_controls.enableZoom   = false;
    graph_controls.enableRotate = false;
    graph_controls.enablePan    = true;
  }
}

/* 諸々の設定 */
editor.setTheme("ace/theme/sqlserver");
editor.getSession().setMode("ace/mode/hydla")
editor.getSession().setTabSize(4);
editor.getSession().setUseSoftTabs(true);
editor.setHighlightActiveLine(false);
editor.$blockScrolling = Infinity;
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true,
  fontSize: "12pt",
});

/* set keybinding */
editor.commands.addCommand({
  name: "runHyLaGI",
  bindKey: {win: "Ctrl-Enter", mac: "Command-Enter"},
  exec: function(editor) { sendHydla(); },
  readonly: true
});

var dat_gui_parameter_folder;
var dat_gui_variable_folder;
var dat_gui_parameter_folder_seek;

var first_script_element;
var dynamic_script_elements = [];

$(document).ready(function(){
  editor.clearSelection();
  /* initialize materialize components */
  $('#file-dropdown-button').dropdown({
    constrain_width: true,
    hover: false,
  });
  $('.axis-dropdown-button').dropdown({
    constrain_width: false,
    hover: false
  });
  $('.modal-trigger').leanModal();
  $('ui.tabs').tabs();

  $("fix_button").on('change', function(){
    replot_all();
  });
  $("step_button").on('change', function(){
    replot_all();
  });

  loadThemeFromWebstorage();
  loadKeyBindingFromWebstorage();
  $('select').material_select();

  first_script_element = document.getElementsByTagName('script')[0];

  plot_settings = browser_storage.getItem('plot_settings');
  if(plot_settings == null)
  {
    plot_settings = {};
  }
  else
  {
    plot_settings = JSON.parse(plot_settings);
  }

  if(plot_settings.plotInterval == undefined)plot_settings.plotInterval = 0.1;
  if(plot_settings.backgroundColor == undefined)plot_settings.backgroundColor = "#000000";
  if(plot_settings.lineWidth == undefined)plot_settings.lineWidth = 1;
  if(plot_settings.scaleLabelVisible == undefined)plot_settings.scaleLabelVisible = true;
  if(plot_settings.twoDimensional == undefined)plot_settings.twoDimensional = false;
  if(plot_settings.autoRotate == undefined)plot_settings.autoRotate = false;
  if(plot_settings.animate == undefined)plot_settings.animate = false;
  if(plot_settings.seek == undefined)plot_settings.seek = 0;

  var add_line_obj = {add: function(){var line = addNewLine("","",""); line.folder.open();} };
  var controler;
  dat_gui = new dat.GUI({autoPlace: false, load: localStorage});
  dat_gui_animate = new dat.GUI({autoPlace: false, load: localStorage});
  dat_gui.add(plot_settings, 'plotInterval', 0.01, 1).step(0.001).name('plot interval').onChange(function(value){replot_all();savePlotSettings();});
  dat_gui.add(plot_settings, 'lineWidth', 1, 10).step(1).name('line width')
    .onChange(function(value){replot_all();savePlotSettings();});
  dat_gui.add(plot_settings, 'scaleLabelVisible').name("show scale label").onChange(function(value){update_axes(true);savePlotSettings();});
  dat_gui.add(plot_settings, 'twoDimensional').name("XY-mode").onChange(function(value){update2DMode();savePlotSettings();});
  dat_gui.add(plot_settings, 'autoRotate').name("auto rotate").onChange(function(value){updateRotate(); savePlotSettings();});
  dat_gui.addColor(plot_settings, 'backgroundColor').name('background')
    .onChange(function(value){setBackgroundColor(value);savePlotSettings();/*render_three_js();i*/});
  dat_gui_animate.add(plot_settings, 'animate').name("stop").onChange(function(value){time_stop();savePlotSettings();});
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

  document.getElementById("nd_mode_check_box").checked = true;

  fixLayoutOfDatGUI();

  if(saved_hydat)
  {
    loadHydat(JSON.parse(saved_hydat));
  }

  
  if(plot_settings.backgroundColor != undefined)
  {
    setBackgroundColor(plot_settings.backgroundColor);
  }

  update2DMode();
  time_stop();

  render();

  // to only scroll when cmd-key is pressed
  graph_controls.enableZoom = false;
  graph_controls.enableRotate = false;
  graph_controls.enablePan = true;

});

function time_stop()
{
  animatable = !plot_settings.animate;
}

function seek()
{
  //if(plot_settings.animate)
  {
    time=plot_settings.seek;
    animate();
  }
}

function updateRotate()
{
  graph_controls.autoRotate = plot_settings.autoRotate;
}

function update2DMode()
{
  graph_controls.enableRotate = !plot_settings.twoDimensional;
  if(plot_settings.twoDimensional)
  {
    graph_camera.position.copy(graph_controls.position0.clone());
    graph_controls.target.set(0, 0, 0);
    graph_camera.updateMatrix(); // make sure camera's local matrix is updated
    graph_camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  }
}

function fixLayoutOfDatGUI()
{
  // to avoid layout collapsion of dat gui
  var dg_c_inputs = $('.dg .c input[type=text]'); 
  for(var i=0; i<dg_c_inputs.length; i++)
  {
    dg_c_inputs[i].style.height = '100%';
  }

  var selectors = $('.selector'); 
  for(var i=0; i<selectors.length; i++)
  {
    selectors[i].style.width = '100%';
  }
}

function savePlotSettings()
{
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

var server_response;

var hylagi_running = false;

function onExecButtonClick()
{
  if(hylagi_running)
  {
    killHyLaGI();
  }
  else
  {
    sendHydLa();
  }
}

function updateExecIcon()
{
  if(hylagi_running)
  {
    var elist = document.getElementsByClassName("exec-icon");
    for (var i = 0; i < elist.length; ++i) {
      elist[i].classList.remove("mdi-content-send");
      elist[i].classList.add("mdi-content-clear");
    }
  }
  else
  {
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
  
  hr.onload = function(progress_ev)
  {
    /* build form data */
    var form = new FormData();
    form.append("hydla_code", editor.getValue());
    var options_value = "";
    if(phase_num.value != "")options_value += " -p " + phase_num.value;
    if(simulation_time.value != "")options_value += " -t " + simulation_time.value;
    if(phase_num.value == "" && simulation_time.value == "")options_value += " -p10";
    if(html_mode_check_box.checked)options_value += " -d --fhtml ";
    if(nd_mode_check_box.checked)options_value += " --fnd ";
    else options_value += " --fno-nd ";
    if(other_options.value != "")options_value += other_options.value;
    form.append("hylagi_option", options_value);
    var timeout_value = "";
    if(timeout_option.value != "")timeout_value = timeout_option.value;
    else timeout_value = "30";
    form.append("timeout_option", timeout_value);
    var xmlhr = new XMLHttpRequest();
    xmlhr.open("POST", "hydat.cgi");
    xmlhr.send(form);
    xmlhr.onload = function(ev) {
      var response = JSON.parse(xmlhr.responseText);

      switch (response.error) {
      case 0:
        Materialize.toast("Simulation was successful.", 1000);
        if(response.hydat != undefined)
        {
          response.hydat.name = browser_storage.getItem("hydla_name");
          loadHydat(response.hydat);
        }
        else
        {
          $('ul.tabs').tabs('select_tab', 'output-area');
        }
        break;
      default:
        if(hylagi_running)
        {
          Materialize.toast("Error message: " + response.message, 3000, "red darken-4");
          $('ul.tabs').tabs('select_tab', 'output-area');
        }
        else
        {
          Materialize.toast("Killed HyLaGI", 1000);
        }
        break;
      }
      server_response = response;
      var output = document.getElementById("output-initial");
      output.innerHTML = "";
      for(var si = 0; si < dynamic_script_elements.length; si++)
      {
        dynamic_script_elements[si].parentNode.removeChild(dynamic_script_elements[si]);
      }
      dynamic_script_elements = [];
      if(html_mode_check_box.checked)
      {
        if(response.stdout != undefined)
        {
          output.innerHTML += response.stdout;
        }
        if(response.stderr != undefined)
        {
          output.innerHTML += response.stderr;
        }
        scriptNodes = output.getElementsByTagName("script");
        for(var si = 0; si < scriptNodes.length; si++)
        {
          if(scriptNodes[si].hasAttribute("src"))
          {
            continue;
          }
          var newScript = document.createElement("script");
          newScript.innerHTML = scriptNodes[si].innerHTML;
          dynamic_script_elements.push(first_script_element.parentNode.insertBefore(newScript, first_script_element));
        }
      }
      else
      {
        if(response.stdout != undefined)
        {
          output.innerHTML += getEscapedStringForHTML(response.stdout);
        }
        if(response.stderr != undefined)
        {
          output.innerHTML += getEscapedStringForHTML(response.stderr);
        }
      }
      stopPreloader();
      hylagi_running = false;
      updateExecIcon();
    };
  };
}

function getEscapedStringForHTML(orig_string)
{
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


function getErrorMessage(sid) {
  var form = document.createElement("form");
  form.action = "error.cgi";
  form.method = "post";
  var id = document.createElement("input");
  id.type = "hidden";
  id.name = "sid";
  id.value = sid;
  document.getElementById("graph").contentDocument.body.appendChild(form);
  form.appendChild(id);
  form.submit();
}

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
function connecttext(elemID, ischeckded) {
  var elm = document.getElementById(elemID);
  if (ischeckded == true) {
    elm.disabled = false;
    elm.classList.remove("hide");
  } else {
    elm.disabled = true;
    elm.classList.add("hide");
  }
}


var resizeLoopCount;

function startResizingGraphArea()
{
  resizeLoopCount = 0;
  setTimeout("resizeGraphArea()", 10);
}

function resizeGraphArea()
{
  resizeLoopCount++;
  resizeGraphRenderer();
  //TODO: do this without timer
  if(resizeLoopCount < 80)    setTimeout("resizeGraphArea()", 10);
}

/* function to close/open input-pane */
(function() {
  var initial_x, initial_width, initial_editor, initial_left, dragging = false;

  function v_separator_mousedown_handler(e){
    initial_x = e.pageX;
    initial_width = $("#left-pane").width();
    initial_left = $("#v-separator").css("left");
    initial_editor = $("#editor").width();
    dragging = true;
    $("<div id='secretdiv'>")
      .css({ position: "absolute",
             left: 0,
             top: 0,
             height: "100%",
             width: "100%",
             zIndex: 100000 })
      .appendTo("body")
      .mousemove(v_separator_mousemove_handler)
      .mouseup(v_separator_mouseup_handler)
  }

  function v_separator_mousemove_handler(e){
    if(!dragging) return;
    var diff = e.pageX - initial_x;
    $("#left-pane").width(initial_width + diff);
    $("#editor").width(initial_editor + diff);
    resizeGraphArea();
    editor.resize();
  }

  function v_separator_mouseup_handler(e){
    dragging = false;
    $("#secretdiv").remove();
  }

  $("#v-separator")
      .mousedown(v_separator_mousedown_handler)
})();


/* function to adjust height of graph-setting-area */
(function() {
  var initial_y, initial_height,
    dragging = false;

  function h_separator_mousedown_handler(e){
    initial_y = e.pageY;
    initial_height = $("#input-pane").height();
    dragging = true;
    $("<div id='secretdiv'>")
      .css({ position: "absolute",
             left: 0,
             top: 0,
             height: "100%",
             width: "100%",
             zIndex: 100000 })
      .appendTo("body")
      .mousemove(h_separator_mousemove_handler)
      .mouseup(h_separator_mouseup_handler)
  }

  function h_separator_mousemove_handler(e){
    if(!dragging) return;
    var diff = e.pageY - initial_y;
    $("#input-pane").height(initial_height + diff);
    $("#editor").height(initial_height + diff);
    editor.resize();
  }

  function h_separator_mouseup_handler(e){
    dragging = false;
    $("#secretdiv").remove();
  }

  $("#h-separator")
    .mousedown(h_separator_mousedown_handler)
})();

function toggleInputPane() {
  var elm = document.getElementById("left-pane");
  var tgl = document.getElementById("v-toggle-icon");
  if(elm.getAttribute("style")) {
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
  var date = d.getFullYear() + "-" + d.getMonth()+1 + "-" + d.getDate() + "T" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
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
  i.addEventListener("change", function(ev) {
    var input_file = i.files[0];
    var fr = new FileReader;
    fr.readAsText(input_file);
    var splitted_strs = input_file.name.split(".");
    var ext = splitted_strs[splitted_strs.length - 1].toLowerCase();
    if(ext == "hydat")
    {
      fr.onload = function(evt) {
        var input_hydat = JSON.parse(fr.result);
        loadHydat(input_hydat);
      };
    } 
    else
    {
      browser_storage.setItem("hydla_name", input_file.name);      
      fr.onload = function(evt) {
        editor.setValue(fr.result);
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
  var date = d.getFullYear() + "-" + d.getMonth()+1 + "-" + d.getDate() + "T" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
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
  Materialize.toast("Saved", 1000);
  setTimeout(function() {
    if (autosave_changed) {
      saveHydlaToWebstorage();
    } else {
      autosave_event_enabled = true;
    }
  }, 5000);
}

autosave_event_enabled = true;
autosave_changed = false;
editor.on("change", function(e) {
  if (autosave_event_enabled) {
    saveHydlaToWebstorage();
  } else {
    autosave_changed = true;
  }
});

/* function to save editor into Web Storage */
function saveKeyBindingToWebstorage() {
  var bind_selector = document.getElementById("key_binding_selector").value;
  browser_storage.setItem("key_binding", bind_selector);
}

function loadKeyBindingFromWebstorage() {
  var key_binding_setting = browser_storage.getItem("key_binding");
  var selector = document.getElementById("key_binding_selector");
  if(key_binding_setting != undefined)
  {
    selector.value = browser_storage.getItem("key_binding");
  }
  else
  {
    selector.value = selector.options[selector.selectedIndex].value;
    browser_storage.setItem("key_binding", selector.value);
  }
  if(selector.value == "") editor.setKeyboardHandler(null);
  else editor.setKeyboardHandler(selector.value);
}

/* function to save theme into Web Storage */
function saveThemeToWebstorage() {
  var theme = document.getElementById("theme_selector").value;
  browser_storage.setItem("theme", theme);
}

function loadThemeFromWebstorage() {
  var theme_setting = browser_storage.getItem("theme");
  if(theme_setting != undefined)
  {
    document.getElementById("theme_selector").value = browser_storage.getItem("theme");
  }else
  {
    browser_storage.setItem("theme", theme_selector.value);
  }
  editor.setTheme("ace/theme/" + theme_selector.value);
}


var plot_lines = {};
var settingsForCurrentHydat = {};


/* function to update variable selector for graph */
function initVariableSelector(hydat) {
  for(var i in plot_lines)
  {
    dat_gui_variable_folder.removeFolder(plot_lines[i].folder.name);
  }

  plot_lines = {};

  //var guard_list ={x:["x", "xSWON"]};

  settingsForCurrentHydat = browser_storage.getItem(hydat.name);
  if(settingsForCurrentHydat != null)
  {
    settingsForCurrentHydat = JSON.parse(settingsForCurrentHydat);
    var line_settings = settingsForCurrentHydat.plot_line_settings;
    for(var i in line_settings)
    {
      var line = addNewLineWithIndex(line_settings[i].x, line_settings[i].y, line_settings[i].z, i);
      /*for(key in guard_list){
        if(line_settings[i].x == key){
          for(var l in guard_list.x){
            addNewLineWithIndexGuard(guard_list.x[l], "x'", "0", i+l);
          }
        }
      }*/
      if(line.settings.x != "" || line.settings.y != "" || line.settings.z != "")line.folder.open();
    }
    replot_all();
  }

  if(Object.keys(plot_lines).length == 0)
  {
    settingsForCurrentHydat = {plot_line_settings: {}};
    var first_line = addNewLine("t", current_hydat != undefined?current_hydat.variables[0]:"", "0");
    first_line.color_angle = 0;
    replot(first_line);
    first_line.folder.open();
  }
  
  dat_gui_variable_folder.open();
}

//TODO: implement this in more elegant way
setTimeout("resizeGraphRenderer()", 200);

dat.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
}

function showToast(message, duration, classes)
{
  Materialize.toast(message, duration, classes);
  var toast_container = document.getElementById("toast-container");
  var i;
  var MAX_CHILDREN_NUM = 5;
  if(toast_container.children.length > MAX_CHILDREN_NUM)
  {
    for(i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++)
    {
      toast_container.removeChild(toast_container.children[i]);
    }
  }
}

function showScrollMessage() {
  // want to show message over the panel when the user tries to scroll on the result panel (graph)
}