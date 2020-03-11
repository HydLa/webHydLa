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
