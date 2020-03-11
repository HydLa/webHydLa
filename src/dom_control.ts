import Materialize from "materialize-css";
import $ from 'jquery';
import { GraphControl } from "./graph_control";
import { EditorControl } from "./editor_control";

export class DOMControl {
  static init() {
    $('select').formSelect();
    $(window).resize(function () {
      GraphControl.resizeGraphRenderer();
    });

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
      GraphControl.replotAll();
    });
    $("step_button").on('change', function () {
      GraphControl.replotAll();
    });

    /* function to close/open input-pane */
    $("#v-separator")
      .mousedown((e) => {
        const initial_x = e.pageX;
        const initial_width = $("#left-pane").width();
        // const initial_left = $("#v-separator").css("left");
        const initial_editor = $("#editor").width();
        let dragging = true;
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
          .mousemove((e) => {
            if (!dragging) return;
            const diff = e.pageX - initial_x;
            $("#left-pane").width(initial_width + diff);
            $("#editor").width(initial_editor + diff);
            GraphControl.resizeGraphArea();
            EditorControl.resize();
          })
          .mouseup((e) => {
            dragging = false;
            $("#secretdiv").remove();
          });
      });

    /* function to adjust height of graph-setting-area */
    $("#h-separator")
      .mousedown((e) => {
        const initial_y = e.pageY;
        const initial_height = $("#input-pane").height();
        let dragging = true;
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
          .mousemove((e) => {
            if (!dragging) return;
            var diff = e.pageY - initial_y;
            $("#input-pane").height(initial_height + diff);
            $("#editor").height(initial_height + diff);
            EditorControl.resize();
          })
          .mouseup((e) => {
            dragging = false;
            $("#secretdiv").remove();
          })
      });
  }
  static showToast(message: string, duration: number, classes: string) {
    Materialize.toast({ html: message, displayLength: duration, classes: classes });
    let toast_container = document.getElementById("toast-container");
    const MAX_CHILDREN_NUM = 5;
    if (toast_container.children.length > MAX_CHILDREN_NUM) {
      for (let i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++) {
        toast_container.removeChild(toast_container.children[i]);
      }
    }
  }

  /* function to start preloader */
  static startPreloader() {
    document.getElementById("graph-preloader").classList.remove("hide");
    document.getElementById("output-preloader").classList.remove("hide");
  }

  /* function called when graph is drawn */
  static stopPreloader() {
    document.getElementById("graph-preloader").classList.add("hide");
    document.getElementById("output-preloader").classList.add("hide");
  }
}
