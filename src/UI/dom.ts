/**
  * functions of buttons and load effect
*/

import Materialize from 'materialize-css';
import { resizeGraphRenderer, replotAll, resizeGraphArea, startResizingGraphArea } from '../graph/graph';
import {
  setEditorFontSize,
  setEditorTheme,
  setEditorKeyBinding,
  resizeEditor,
  loadFile,
  saveHydla,
} from '../editor/editor';
import { execHyLaGI } from '../editor/hylagi';
import { saveHydat } from '../hydat/hydat';
import { saveThemeToStorage, saveKeyBindingToStorage } from '../storage';

class DOMState {
  static tabs: Materialize.Tabs;
}

// eslint-disable-next-line max-lines-per-function
export function initDOMState() {
  Materialize.FormSelect.init(document.querySelectorAll('select'));
  $(window).resize(function () {
    resizeGraphRenderer();
  });

  /* initialize materialize components */
  Materialize.Dropdown.init(document.querySelectorAll('#file-dropdown-button'), {
    constrainWidth: true,
    hover: false,
  });
  Materialize.Modal.init(document.querySelectorAll('.modal'));
  DOMState.tabs = Materialize.Tabs.init(document.getElementById('tabs')!);

  document.getElementById('editor_font_size')?.addEventListener('change', (e) => {
    setEditorFontSize((e.target as HTMLInputElement).valueAsNumber);
  });

  document.getElementById('theme_selector')?.addEventListener('change', (e) => {
    setEditorTheme((e.target as HTMLInputElement).value);
    saveThemeToStorage();
  });

  document.getElementById('key_binding_selector')?.addEventListener('change', (e) => {
    setEditorKeyBinding((e.target as HTMLInputElement).value);
    saveKeyBindingToStorage();
  });

  document.getElementById('load-file')?.addEventListener('click', () => {
    loadFile();
  });
  document.getElementById('save-hydla')?.addEventListener('click', () => {
    saveHydla();
  });
  document.getElementById('save-hydat')?.addEventListener('click', () => {
    saveHydat();
  });
  document.getElementById('run_button')?.addEventListener('click', () => {
    execHyLaGI();
  });
}

export function showToast(message: string, duration: number, classes: string) {
  Materialize.toast({ html: message, displayLength: duration, classes: classes });
  const toastContainer = document.getElementById('toast-container')!;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const MAX_CHILDREN_NUM = 5;
  for (let i = 0; i < toastContainer.children.length - MAX_CHILDREN_NUM; i++) {
    toastContainer.removeChild(toastContainer.children[i]);
  }
}

/* function to start preloader */
export function startPreloader() {
  document.getElementById('graph-preloader')!.classList.remove('hide');
  document.getElementById('output-preloader')!.classList.remove('hide');
}

/* function called when graph is drawn */
export function stopPreloader() {
  document.getElementById('graph-preloader')!.classList.add('hide');
  document.getElementById('output-preloader')!.classList.add('hide');
}

export function selectLogTab() {
  DOMState.tabs.select('output-area');
}
