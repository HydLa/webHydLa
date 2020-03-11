import Materialize from "materialize-css";
import $ from 'jquery';
import { Graph } from "./graph";
import { EditorControl } from "./editor_control";

export class DOMControl {
  static init(graph:Graph, editor:EditorControl) {
    $('select').formSelect();
    $(window).resize(function () {
      graph.resizeGraphRenderer();
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
      graph.replotAll();
    });
    $("step_button").on('change', function () {
      graph.replotAll();
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
            graph.resizeGraphArea();
            editor.resize();
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
            editor.resize();
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
}
