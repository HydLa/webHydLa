import * as ace from "ace-builds";
import "ace-builds/src-noconflict/theme-sqlserver"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/theme-github"
import "ace-builds/src-noconflict/theme-clouds"
import "ace-builds/src-noconflict/keybinding-emacs"
import "ace-builds/src-noconflict/keybinding-vim"

/* set default hydla code */
const default_hydla =
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

export class EditorControl {
  editor: ace.Ace.Editor;
  constructor() {
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
      exec: function (editor) { sendHydLa(); },
      readOnly: true
    });

    /* load saved hydla code if it exist */
    var saved_hydla = browser_storage.getItem("hydla");
    var saved_hydat = browser_storage.getItem("hydat");
    if (saved_hydla) {
      this.editor.setValue(saved_hydla);
    } else {
      browser_storage.setItem("hydla_name", "bouncing_ball");
      this.editor.setValue(default_hydla);
    }
    this.editor.clearSelection();
  }
}
