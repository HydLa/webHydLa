import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-sqlserver';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds';
import 'ace-builds/src-noconflict/keybinding-emacs';
import 'ace-builds/src-noconflict/keybinding-vim';

import { showToast } from './dom_control';
import { StorageControl } from './storage_control';
import { HyLaGIController } from './hylagi';
import { HydatControl } from './hydat_control';

/* set default hydla code */
const default_hydla = `// a sample hydla code: bouncing_particle.hydla

INIT <=> y = 10 & y' = 0.
FALL <=> [](y'' = -10).
BOUNCE <=> [](y- = 0 => y' = -4/5 * y'-).

INIT, FALL << BOUNCE.

// #hylagi -p 10
`;

class EditorControlState {
  static editor: ace.Ace.Editor;
  static autosave_event_enabled = true;
  static autosave_changed = false;
}

export function init(saved_hydla: string | null) {
  /* ID="editor" な div をエディタにする */
  EditorControlState.editor = ace.edit('editor');

  /* 諸々の設定 */
  EditorControlState.editor.setTheme('ace/theme/sqlserver');
  ace.config.setModuleUrl('ace/mode/hydla', './mode-hydla.js');
  EditorControlState.editor.getSession().setMode('ace/mode/hydla');
  EditorControlState.editor.getSession().setTabSize(4);
  EditorControlState.editor.getSession().setUseSoftTabs(true);
  EditorControlState.editor.getSession().setUseWrapMode(true);
  EditorControlState.editor.setHighlightActiveLine(false);
  EditorControlState.editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
    fontSize: '12pt',
  });

  /* set keybinding */
  EditorControlState.editor.commands.addCommand({
    name: 'runHyLaGI',
    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
    exec: function () {
      HyLaGIController.sendHydLa(getEditedCode());
    },
    readOnly: true,
  });

  /* load saved hydla code if it exist */
  if (saved_hydla) {
    setEditorACode(saved_hydla);
  } else {
    StorageControl.saveHydlaName('bouncing_ball');
    setEditorACode(default_hydla);
  }
  EditorControlState.editor.clearSelection();

  EditorControlState.editor.on('change', () => {
    if (EditorControlState.autosave_event_enabled) {
      saveHydlaToWebstorage();
    } else {
      EditorControlState.autosave_changed = true;
    }
  });
}

/* function to save HydLa file */
export function saveHydla() {
  const blob = new Blob([EditorControlState.editor.getValue()]);
  const object = window.URL.createObjectURL(blob);
  const d = new Date();
  const date =
    d.getFullYear() +
    '-' +
    d.getMonth() +
    1 +
    '-' +
    d.getDate() +
    'T' +
    d.getHours() +
    '-' +
    d.getMinutes() +
    '-' +
    d.getSeconds();
  const a = document.createElement('a');
  a.href = object;
  a.download = date + '.hydla';
  const event = document.createEvent('MouseEvents');
  event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(event);
}

export function loadFile() {
  const i = document.createElement('input');
  i.type = 'file';
  const event = document.createEvent('MouseEvents');
  event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  i.addEventListener(
    'change',
    () => {
      if (!i.files) {
        throw new Error('unexpected: i.files is undefined');
      }
      const input_file = i.files[0];
      const fr = new FileReader();
      fr.readAsText(input_file);
      const splitted_strs = input_file.name.split('.');
      const ext = splitted_strs[splitted_strs.length - 1].toLowerCase();
      if (ext == 'hydat') {
        fr.onload = () => {
          HydatControl.loadHydat(JSON.parse(<string>fr.result));
        };
      } else {
        StorageControl.saveHydlaName(input_file.name);
        fr.onload = () => {
          setEditorACode(<string>fr.result);
        };
      }
    },
    false
  );
  i.dispatchEvent(event);
}

/* function to save HydLa code into Web Storage */
export function saveHydlaToWebstorage() {
  EditorControlState.autosave_event_enabled = false;
  EditorControlState.autosave_changed = false;
  StorageControl.saveHydla(EditorControlState.editor.getValue());
  showToast('Saved', 1000, '');

  setTimeout(() => {
    if (EditorControlState.autosave_changed) {
      saveHydlaToWebstorage();
    } else {
      EditorControlState.autosave_event_enabled = true;
    }
  }, 5000);
}

export function setKeyBinding(binding: string | null) {
  if (!binding) EditorControlState.editor.setKeyboardHandler('');
  else EditorControlState.editor.setKeyboardHandler(binding);
}

export function setTheme(theme: string) {
  EditorControlState.editor.setTheme(`ace/theme/${theme}`);
}

export function resize() {
  EditorControlState.editor.resize();
}

export function setFontSize(n: number) {
  EditorControlState.editor.setOption('fontSize', n);
}

/* set the code to edit */
export function setEditorACode(code: string) {
  EditorControlState.editor.setValue(code);
}

/* get the edited code */
export function getEditedCode(): string {
  return EditorControlState.editor.getValue();
}
