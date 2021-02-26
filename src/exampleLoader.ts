import { setEditorHydla } from './editorControl';

/**
 * HyLaGIのレポジトリから例題を取得する
 */

const path = new URL('https://api.github.com/repos/HydLa/HyLaGI/contents/examples');

export function initExampleLoader() {
  loadExamples();
}

async function loadExamples() {
  const filenames = await getFilenames();

  // 選択可能な例題に取得したファイル名を追加
  for (const name of filenames) {
    const select = <HTMLElement>document.getElementById('example_selector');
    const option = document.createElement('option');
    option.text = name;
    option.value = name;
    select.appendChild(option);
  }
  (<any>$('#example_selector')).formSelect();

  document.getElementById('load-examples-button')?.addEventListener('click', () => {
    loadContents();
  });
}

async function getFilenames() {
  const filenames: string[] = [];

  const res = await fetch(path.toString());
  const json = await res.json();
  // 例題ディレクトリからHydLaプログラムのファイル名を取得
  for (const f of json) {
    if (isHydlaFile(f.name)) {
      filenames.push(f.name);
    }
  }

  return filenames;
}

async function loadContents() {
  const filename = getSelectedFilename();
  if (filename === null) return;
  const content = await getContent(filename);
  setEditorHydla(content);
}

function getSelectedFilename() {
  const selected = document.getElementsByClassName('selected');
  let fileindex = -1;
  for (let i = 0; i < selected.length; i++) {
    if (isHydlaFile(<string>selected[i].textContent)) {
      fileindex = i;
    }
  }
  if (fileindex == -1) return null;
  return selected[fileindex].textContent;
}

async function getContent(filename: string) {
  const url = `${path}/${filename}`;
  const res = await fetch(url);
  const json = await res.json();
  const encodedContent = json.content.replace(/\n/g, '');
  const content = atob(encodedContent);
  return content;
}

function isHydlaFile(s: string) {
  return s.indexOf('.hydla') != -1;
}
