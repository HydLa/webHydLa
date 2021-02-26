import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-sqlserver';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds';
import 'ace-builds/src-noconflict/keybinding-emacs';
import 'ace-builds/src-noconflict/keybinding-vim';

import { showToast } from './dom';
import { saveHydlaToStorage, saveHydlaNameToStorage } from './storage';
import { sendHydla } from './hylagi';
import { loadHydat } from './hydat';

/* set default hydla code */
const defaultHydla = `// a sample hydla code: bouncing_particle.hydla

INIT <=> y = 10 & y' = 0.
FALL <=> [](y'' = -10).
BOUNCE <=> [](y- = 0 => y' = -4/5 * y'-).

INIT, FALL << BOUNCE.

// #hylagi -p 10
`;

class EditorState {
  static editor: ace.Ace.Editor;
  static autosaveEventEnabled = true;
  static autosaveChanged = false;
}

export function initEditorState(savedHydla: string | null) {
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
  if (savedHydla) {
    setEditorHydla(savedHydla);
  } else {
    saveHydlaNameToStorage('bouncing_ball');
    setEditorHydla(defaultHydla);
  }
  EditorState.editor.clearSelection();

  EditorState.editor.on('change', () => {
    if (EditorState.autosaveEventEnabled) {
      saveHydlaToWebstorage();
    } else {
      EditorState.autosaveChanged = true;
    }
  });
}

export function sendEditorHydla() {
  sendHydla(EditorState.editor.getValue());
}

export function saveHydla() {
  saveFile('hydla', EditorState.editor.getValue());
}

export function saveFile(extension: string, content: string) {
  const blob = new Blob([content]);
  const object = window.URL.createObjectURL(blob);
  const d = new Date();
  const timestamp = `${d.getFullYear()}-${
    d.getMonth() + 1
  }-${d.getDate()}T${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
  const a = document.createElement('a');
  a.href = object;
  a.download = `${timestamp}.${extension}`;
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
      const inputFile = i.files[0];
      const fr = new FileReader();
      fr.readAsText(inputFile);
      const splittedStrs = inputFile.name.split('.');
      const ext = splittedStrs[splittedStrs.length - 1].toLowerCase();
      if (ext == 'hydat') {
        fr.onload = () => {
          loadHydat(JSON.parse(<string>fr.result));
        };
      } else {
        saveHydlaNameToStorage(inputFile.name);
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
  EditorState.autosaveEventEnabled = false;
  EditorState.autosaveChanged = false;
  saveHydlaToStorage(EditorState.editor.getValue());
  showToast('Saved', 1000, '');

  setTimeout(() => {
    if (EditorState.autosaveChanged) {
      saveHydlaToWebstorage();
    } else {
      EditorState.autosaveEventEnabled = true;
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
