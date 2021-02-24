import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-sqlserver';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds';
import 'ace-builds/src-noconflict/keybinding-emacs';
import 'ace-builds/src-noconflict/keybinding-vim';

import { showToast } from './dom_control';
import { saveHydlaToStorage, saveHydlaNameToStorage } from './storage_control';
import { sendHydla } from './hylagi';
import { loadHydat } from './hydat_control';

/* set default hydla code */
const default_hydla = `// a sample hydla code: bouncing_particle.hydla

INIT <=> y = 10 & y' = 0.
FALL <=> [](y'' = -10).
BOUNCE <=> [](y- = 0 => y' = -4/5 * y'-).

INIT, FALL << BOUNCE.

// #hylagi -p 10
`;

class EditorState {
  static editor: ace.Ace.Editor;
  static autosave_event_enabled = true;
  static autosave_changed = false;
}

export function initEditorState(saved_hydla: string | null) {
  /* ID="editor" な div をエディタにする */
  EditorState.editor = ace.edit('editor');

  /* 諸々の設定 */
  setEditorTheme('ace/theme/sqlserver');
  ace.config.setModuleUrl('ace/mode/hydla', './mode-hydla.js');
  EditorState.editor.getSession().setMode('ace/mode/hydla');
  EditorState.editor.getSession().setTabSize(4);
  EditorState.editor.getSession().setUseSoftTabs(true);
  EditorState.editor.getSession().setUseWrapMode(true);
  EditorState.editor.setHighlightActiveLine(false);
  EditorState.editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
    fontSize: '12pt',
  });

  /* set keybinding */
  EditorState.editor.commands.addCommand({
    name: 'runHyLaGI',
    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
    exec: function () {
      sendEditorHydla();
    },
    readOnly: true,
  });

  /* load saved hydla code if it exist */
  if (saved_hydla) {
    setEditorHydla(saved_hydla);
  } else {
    saveHydlaNameToStorage('bouncing_ball');
    setEditorHydla(default_hydla);
  }
  EditorState.editor.clearSelection();

  EditorState.editor.on('change', () => {
    if (EditorState.autosave_event_enabled) {
      saveHydlaToWebstorage();
    } else {
      EditorState.autosave_changed = true;
    }
  });
}

export function sendEditorHydla() {
  sendHydla(EditorState.editor.getValue());
}

/*
 * function to save HydLa file
 * TODO: hydat_control.tsのsaveHydatと共通化
 */
export function saveHydla() {
  const blob = new Blob([EditorState.editor.getValue()]);
  const object = window.URL.createObjectURL(blob);
  const d = new Date();
  const date = `${d.getFullYear()}-${
    d.getMonth() + 1
  }-${d.getDate()}T${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
  const a = document.createElement('a');
  a.href = object;
  a.download = `${date}.hydla`;
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
          loadHydat(JSON.parse(<string>fr.result));
        };
      } else {
        saveHydlaNameToStorage(input_file.name);
        fr.onload = () => {
          setEditorHydla(<string>fr.result);
        };
      }
    },
    false
  );
  i.dispatchEvent(event);
}

/* function to save HydLa code into Web Storage */
export function saveHydlaToWebstorage() {
  EditorState.autosave_event_enabled = false;
  EditorState.autosave_changed = false;
  saveHydlaToStorage(EditorState.editor.getValue());
  showToast('Saved', 1000, '');

  setTimeout(() => {
    if (EditorState.autosave_changed) {
      saveHydlaToWebstorage();
    } else {
      EditorState.autosave_event_enabled = true;
    }
  }, 5000);
}

export function setEditorKeyBinding(binding: string | null) {
  if (!binding) EditorState.editor.setKeyboardHandler('');
  else EditorState.editor.setKeyboardHandler(binding);
}

export function setEditorTheme(theme: string) {
  EditorState.editor.setTheme(`ace/theme/${theme}`);
}

export function resizeEditor() {
  EditorState.editor.resize();
}

export function setEditorFontSize(n: number) {
  EditorState.editor.setOption('fontSize', n);
}

/* function to set HydLa code to editor */
export function setEditorHydla(hydla: string) {
  EditorState.editor.setValue(hydla);
}
