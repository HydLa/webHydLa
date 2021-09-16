/**
  * control "zoom in/out" of graph area
*/

import $ from 'jquery';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const keyShift = 16;
const keyCtr = 17;
const keyAlt = 18;
const keyMetaL = 91; //windows button

export class NewUI {
  static init(controls: OrbitControls) {
    let inGraphArea: boolean;
    $('#graph-area').hover(
      () => {
        inGraphArea = true;
      },
      function () {
        inGraphArea = false;
        $('#scroll-message').css('opacity', '0');
      }
    );

    let timeout: NodeJS.Timeout;
    $('body').scroll(function () {
      clearTimeout(timeout);
      if (inGraphArea == true) {
        $('#scroll-message').css('opacity', '0.65');
        timeout = setTimeout(function () {
          $('#scroll-message').css('opacity', '0');
        }, 1150);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!e) return;
      if (e.keyCode === keyShift || e.keyCode === keyCtr || e.keyCode === keyAlt || e.keyCode === keyMetaL) {
        this.enableZoom(controls);
        $('#scroll-message').css('opacity', '0');
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!e) return;
      if (e.keyCode === keyShift || e.keyCode === keyCtr || e.keyCode === keyAlt || e.keyCode === keyMetaL) {
        this.disableZoom(controls);
      }
    });

    this.initScrollZoom(controls);
  }

  static enableZoom(controls: OrbitControls) {
    controls.enableZoom = true;
    $('body').css('overflow-y', 'hidden');  //side scroll bar hidden
  }

  static disableZoom(controls: OrbitControls) {
    controls.enableZoom = false;
    $('body').css('overflow-y', 'visible'); //side scroll bar visible
  }

  static initScrollZoom(controls: OrbitControls) {
    this.disableZoom(controls);
  }
}
