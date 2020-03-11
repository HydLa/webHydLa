import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// below are functions added for new UI

const key_shift = 16;
const key_ctr = 17;
const key_alt = 18;
const key_meta_l = 91;

export class NewUI{
  controls: OrbitControls;
  constructor(controls: OrbitControls) {
    this.controls = controls;

    let in_graph_area: boolean;
    $('#graph-area').hover(
      () => { in_graph_area = true; },
      function () { in_graph_area = false; $('#scroll-message').css("opacity", "0"); }
    );

    let timeout: NodeJS.Timeout;
    $("body").scroll(function () {
      clearTimeout(timeout);
      if (in_graph_area == true) {
        $('#scroll-message').css("opacity", "0.65");
        timeout = setTimeout(function () { $('#scroll-message').css("opacity", "0"); }, 1150);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!e) return;
      if (e.keyCode === key_shift || e.keyCode === key_ctr || e.keyCode === key_alt || e.keyCode === key_meta_l) {
        this.enableZoom(); $('#scroll-message').css("opacity", "0");
      }
    });

    document.addEventListener("keyup", (e) => {
      if (!e) return;
      if (e.keyCode === key_shift || e.keyCode === key_ctr || e.keyCode === key_alt || e.keyCode === key_meta_l) {
        this.disableZoom();
      }
    });

    this.initScrollZoom();
  }

  isClassicUI() {
    const elem = <HTMLInputElement>document.getElementById("classic_ui_flag");
    return elem.value === "true"
  }
  
  enableZoom() {
    if (this.isClassicUI()) return;
    this.controls.enableZoom = true;
    $('body').css("overflow-y", "hidden");
  }

  disableZoom() {
    if (this.isClassicUI()) return;
    this.controls.enableZoom = false;
    $('body').css("overflow-y", "visible");
  }
  
  initScrollZoom() {
    this.disableZoom();
  }
}
