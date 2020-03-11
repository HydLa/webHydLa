import $ from 'jquery';
import Materialize from "materialize-css";
import { CommonData } from "./common";




// $(document).ready(function () {
let common = new CommonData();
// });

$(window).resize(function () {
  common.graph.resizeGraphRenderer();
});












// function onExecButtonClick() {
//   if (hylagi_running) {
//     killHyLaGI();
//   }
//   else {
//     sendHydLa();
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
