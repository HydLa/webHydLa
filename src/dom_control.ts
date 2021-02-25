import Materialize from 'materialize-css';
import { resizeGraphRenderer, replotAll, resizeGraphArea, startResizingGraphArea } from './graph_control';
import {
  setEditorFontSize,
  setEditorTheme,
  setEditorKeyBinding,
  resizeEditor,
  loadFile,
  saveHydla,
} from './editor_control';
import { saveHydat } from './hydat_control';
import { execHyLaGI } from './hylagi';
import { saveThemeToStorage, saveKeyBindingToStorage } from './storage_control';

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
  Materialize.Dropdown.init(document.querySelectorAll('.axis-dropdown-button'), {
    constrainWidth: false,
    hover: false,
  });
  Materialize.Modal.init(document.querySelectorAll('.modal'));
  DOMState.tabs = Materialize.Tabs.init(document.getElementById('tabs')!);

  $('fix_button').on('change', function () {
    replotAll();
  });
  $('stepButton').on('change', function () {
    replotAll();
  });

  document.getElementById('editorFontSize')?.addEventListener('change', (e) => {
    setEditorFontSize((e.target as HTMLInputElement).valueAsNumber);
  });

  document.getElementById('themeSelector')?.addEventListener('change', (e) => {
    setEditorTheme((e.target as HTMLInputElement).value);
    saveThemeToStorage();
  });

  document.getElementById('keyBindingSelector')?.addEventListener('change', (e) => {
    setEditorKeyBinding((e.target as HTMLInputElement).value);
    saveKeyBindingToStorage();
  });

  /* function to close/open input-pane */
  $('#v-separator').mousedown((e) => {
    const initialX = e.pageX;
    const initialWidth = $('#left-pane').width()!;
    const initialEditor = $('#editor').width()!;
    let dragging = true;
    $("<div id='secretdiv'>")
      .css({
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        zIndex: 100000,
      })
      .appendTo('body')
      .mousemove((e) => {
        if (!dragging) return;
        const diff = e.pageX - initialX;
        $('#left-pane').width(initialWidth + diff);
        $('#editor').width(initialEditor + diff);
        resizeGraphArea();
        resizeEditor();
      })
      .mouseup(() => {
        dragging = false;
        $('#secretdiv').remove();
      });
  });

  /* function to adjust height of graph-setting-area */
  $('#h-separator').mousedown((e) => {
    const initialY = e.pageY;
    const initialHeight = $('#input-pane').height()!;
    let dragging = true;
    $("<div id='secretdiv'>")
      .css({
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '100%',
        zIndex: 100000,
      })
      .appendTo('body')
      .mousemove((e) => {
        if (!dragging) return;
        const diff = e.pageY - initialY;
        $('#input-pane').height(initialHeight + diff);
        $('#editor').height(initialHeight + diff);
        resizeEditor();
      })
      .mouseup(() => {
        dragging = false;
        $('#secretdiv').remove();
      });
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
  document.getElementById('runButton')?.addEventListener('click', () => {
    execHyLaGI();
  });
  document.getElementById('toggle-input-pane')?.addEventListener('click', () => {
    toggleInputPane();
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

export function toggleInputPane() {
  const elm = document.getElementById('left-pane')!;
  const tgl = document.getElementById('v-toggle-icon')!;
  if (elm.getAttribute('style')) {
    elm.removeAttribute('style');
    tgl.classList.remove('mdi-navigation-chevron-right');
    tgl.classList.add('mdi-navigation-chevron-left');
  } else {
    elm.style.width = '0px';
    tgl.classList.remove('mdi-navigation-chevron-left');
    tgl.classList.add('mdi-navigation-chevron-right');
  }
  startResizingGraphArea();
}

export function selectLogTab() {
  DOMState.tabs.select('output-area');
}
