import Materialize from "materialize-css";
import { GraphControl } from "./graph_control";
import { EditorControl } from "./editor_control";
import { HydatControl } from "./hydat_control";
import { HyLaGIController } from "./hylagi";
import { StorageControl } from "./storage_control";

export class DOMControl {
  static tabs: Materialize.Tabs;

  static init() {
    Materialize.FormSelect.init(document.querySelectorAll("select"));
    $(window).resize(function () {
      GraphControl.resizeGraphRenderer();
    });

    /* initialize materialize components */
    Materialize.Dropdown.init(
      document.querySelectorAll("#file-dropdown-button"), {
      constrainWidth: true,
      hover: false,
    });
    Materialize.Dropdown.init(
      document.querySelectorAll('.axis-dropdown-button'), {
      constrainWidth: false,
      hover: false
    });
    Materialize.Modal.init(document.querySelectorAll('.modal'));
    DOMControl.tabs = Materialize.Tabs.init(document.getElementById("tabs")!);

    $("fix_button").on('change', function () {
      GraphControl.replotAll();
    });
    $("step_button").on('change', function () {
      GraphControl.replotAll();
    });

    document.getElementById("editor_font_size")?.addEventListener("change", (e) => {
      EditorControl.setFontSize((e.target as HTMLInputElement).valueAsNumber);
    })

    document.getElementById("theme_selector")?.addEventListener("change", (e) => {
      EditorControl.setTheme((e.target as HTMLInputElement).value);
      StorageControl.saveTheme();
    })

    document.getElementById("key_binding_selector")?.addEventListener("change", (e) => {
      EditorControl.setKeyBinding((e.target as HTMLInputElement).value);
      StorageControl.saveKeyBinding();
    })

    /* function to close/open input-pane */
    $("#v-separator")
      .mousedown((e) => {
        const initial_x = e.pageX;
        const initial_width = $("#left-pane").width()!;
        const initial_editor = $("#editor").width()!;
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
          .mouseup(() => {
            dragging = false;
            $("#secretdiv").remove();
          });
      });

    /* function to adjust height of graph-setting-area */
    $("#h-separator")
      .mousedown((e) => {
        const initial_y = e.pageY;
        const initial_height = $("#input-pane").height()!;
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
            const diff = e.pageY - initial_y;
            $("#input-pane").height(initial_height + diff);
            $("#editor").height(initial_height + diff);
            EditorControl.resize();
          })
          .mouseup(() => {
            dragging = false;
            $("#secretdiv").remove();
          })
      });

    document.getElementById("load-file")?.addEventListener("click", () => {
      EditorControl.loadFile();
    });
    document.getElementById("save-hydla")?.addEventListener("click", () => {
      EditorControl.saveHydla();
    });
    document.getElementById("save-hydat")?.addEventListener("click", () => {
      HydatControl.saveHydat();
    });
    document.getElementById("run_button")?.addEventListener("click", () => {
      HyLaGIController.exec();
    });
    document.getElementById("toggle-input-pane")?.addEventListener("click", () => {
      DOMControl.toggleInputPane();
    });
  }
  static showToast(message: string, duration: number, classes: string) {
    Materialize.toast({ html: message, displayLength: duration, classes: classes });
    const toast_container = document.getElementById("toast-container")!;
    const MAX_CHILDREN_NUM = 5;
    if (toast_container.children.length > MAX_CHILDREN_NUM) {
      for (let i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++) {
        toast_container.removeChild(toast_container.children[i]);
      }
    }
  }

  /* function to start preloader */
  static startPreloader() {
    document.getElementById("graph-preloader")!.classList.remove("hide");
    document.getElementById("output-preloader")!.classList.remove("hide");
  }

  /* function called when graph is drawn */
  static stopPreloader() {
    document.getElementById("graph-preloader")!.classList.add("hide");
    document.getElementById("output-preloader")!.classList.add("hide");
  }

  static toggleInputPane() {
    const elm = document.getElementById("left-pane")!;
    const tgl = document.getElementById("v-toggle-icon")!;
    if (elm.getAttribute("style")) {
      elm.removeAttribute("style");
      tgl.classList.remove("mdi-navigation-chevron-right");
      tgl.classList.add("mdi-navigation-chevron-left");
    } else {
      elm.style.width = "0px";
      tgl.classList.remove("mdi-navigation-chevron-left");
      tgl.classList.add("mdi-navigation-chevron-right");
    }
    GraphControl.startResizingGraphArea();
  }

  static selectLogTab() {
    this.tabs.select("output-area");
  }
}
