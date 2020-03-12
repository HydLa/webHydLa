import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-sqlserver"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-clouds"
import "ace-builds/src-noconflict/keybinding-emacs"
import "ace-builds/src-noconflict/keybinding-vim"
import { DOMControl } from "./dom_control";
import { StorageControl } from "./storage_control";
import { HyLaGIController } from "./hylagi";
import { HydatControl } from "./hydat_control";

/* set default hydla code */
const default_hydla = `// a sample hydla code: bouncing_particle.hydla

INIT <=> y = 10 & y' = 0.
FALL <=> [](y'' = -10).
BOUNCE <=> [](y- = 0 => y' = -4/5 * y'-).

INIT, FALL << BOUNCE.

// #hylagi -p 10
`;

export class EditorControl {
  static editor: ace.Ace.Editor;
  static autosave_event_enabled = true;
  static autosave_changed = false;
  static init(saved_hydla:string) {
    /* ID="editor" な div をエディタにする */
    this.editor = ace.edit("editor");

    /* 諸々の設定 */
    this.editor.setTheme("ace/theme/sqlserver");
    this.editor.getSession().setMode("ace/mode/hydla")
    this.editor.getSession().setTabSize(4);
    this.editor.getSession().setUseSoftTabs(true);
    this.editor.setHighlightActiveLine(false);
    // this.editor.$blockScrolling = Infinity;
    this.editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
      fontSize: "12pt",
    });

    /* set keybinding */
    this.editor.commands.addCommand({
      name: "runHyLaGI",
      bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
      exec: function (editor) { EditorControl.sendHydLa(); },
      readOnly: true
    });

    /* load saved hydla code if it exist */
    if (saved_hydla) {
      this.editor.setValue(saved_hydla);
    } else {
      browser_storage.setItem("hydla_name", "bouncing_ball");
      this.editor.setValue(default_hydla);
    }
    this.editor.clearSelection();

    let that = this;
    this.editor.on("change", (_) => {
      if (that.autosave_event_enabled) {
        that.saveHydlaToWebstorage();
      } else {
        that.autosave_changed = true;
      }
    });
  }

  static sendHydLa() {
    HyLaGIController.sendHydLa(this.editor.getValue());
  }

  /* function to save HydLa file */
  static saveHydla() {
    var blob = new Blob([this.editor.getValue()])
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

  static loadFile() {
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
          HydatControl.loadHydat(JSON.parse(<string>fr.result));
        };
      }
      else {
        browser_storage.setItem("hydla_name", input_file.name);
        fr.onload = (_) => {
          this.editor.setValue(<string>fr.result);
        };
      }
    }, false);
    i.dispatchEvent(event);
  }

  /* function to save HydLa code into Web Storage */
  static saveHydlaToWebstorage() {
    this.autosave_event_enabled = false;
    this.autosave_changed = false;
    StorageControl.saveHydla(this.editor.getValue());
    DOMControl.showToast("Saved", 1000, "");

    let that = this;
    setTimeout(function () {
      if (that.autosave_changed) {
        that.saveHydlaToWebstorage();
      } else {
        that.autosave_event_enabled = true;
      }
    }, 5000);
  }

  static setKeyBinding(binding:string|null) {
    this.editor.setKeyboardHandler(binding);
  }

  static setTheme(theme:string) {
    this.editor.setTheme("ace/theme/" + theme)
  }

  static resize() {
    this.editor.resize();
  }
}
