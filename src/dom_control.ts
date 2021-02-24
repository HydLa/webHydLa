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
import { StorageControl } from './storage_control';

class DOMState {
  static tabs: Materialize.Tabs;
}

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
  $('step_button').on('change', function () {
    replotAll();
  });

  document.getElementById('editor_font_size')?.addEventListener('change', (e) => {
    setEditorFontSize((e.target as HTMLInputElement).valueAsNumber);
  });

  document.getElementById('theme_selector')?.addEventListener('change', (e) => {
    setEditorTheme((e.target as HTMLInputElement).value);
    StorageControl.saveTheme();
  });

  document.getElementById('key_binding_selector')?.addEventListener('change', (e) => {
    setEditorKeyBinding((e.target as HTMLInputElement).value);
    StorageControl.saveKeyBinding();
  });

  /* function to close/open input-pane */
  $('#v-separator').mousedown((e) => {
    const initial_x = e.pageX;
    const initial_width = $('#left-pane').width()!;
    const initial_editor = $('#editor').width()!;
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
        const diff = e.pageX - initial_x;
        $('#left-pane').width(initial_width + diff);
        $('#editor').width(initial_editor + diff);
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
    const initial_y = e.pageY;
    const initial_height = $('#input-pane').height()!;
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
        const diff = e.pageY - initial_y;
        $('#input-pane').height(initial_height + diff);
        $('#editor').height(initial_height + diff);
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
  document.getElementById('run_button')?.addEventListener('click', () => {
    execHyLaGI();
  });
  document.getElementById('toggle-input-pane')?.addEventListener('click', () => {
    toggleInputPane();
  });
}

export function showToast(message: string, duration: number, classes: string) {
  Materialize.toast({ html: message, displayLength: duration, classes: classes });
  const toast_container = document.getElementById('toast-container')!;
  const MAX_CHILDREN_NUM = 5;
  for (let i = 0; i < toast_container.children.length - MAX_CHILDREN_NUM; i++) {
    toast_container.removeChild(toast_container.children[i]);
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
