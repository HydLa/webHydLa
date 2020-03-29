import $ from 'jquery';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// below are functions added for new UI

const key_shift = 16;
const key_ctr = 17;
const key_alt = 18;
const key_meta_l = 91;

export class NewUI{
  static init(controls: OrbitControls) {
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
        this.enableZoom(controls); $('#scroll-message').css("opacity", "0");
      }
    });

    document.addEventListener("keyup", (e) => {
      if (!e) return;
      if (e.keyCode === key_shift || e.keyCode === key_ctr || e.keyCode === key_alt || e.keyCode === key_meta_l) {
        this.disableZoom(controls);
      }
    });

    this.initScrollZoom(controls);
  }

  static isClassicUI() {
    const elem = <HTMLInputElement>document.getElementById("classic_ui_flag");
    return elem.value === "true"
  }
  
  static enableZoom(controls: OrbitControls) {
    if (this.isClassicUI()) return;
    controls.enableZoom = true;
    $('body').css("overflow-y", "hidden");
  }

  static disableZoom(controls: OrbitControls) {
    if (this.isClassicUI()) return;
    controls.enableZoom = false;
    $('body').css("overflow-y", "visible");
  }
  
  static initScrollZoom(controls: OrbitControls) {
    this.disableZoom(controls);
  }
}
