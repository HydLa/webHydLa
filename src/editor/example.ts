import { setEditorHydla } from '../editor/editor';

/**
 * HyLaGIのレポジトリから例題を取得する
 */

const path = new URL('https://api.github.com/repos/HydLa/HyLaGI/contents/examples');

export function initExample() {
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
  const res = await fetch(path.toString());
  const json = await res.json();

  // 例題ディレクトリからHydLaプログラムのファイル名を取得
  return [...json].map((f) => f.name).filter(isHydlaFile);
}

async function loadContents() {
  const filename = getSelectedFilename();
  if (filename === null) return;
  const content = await getContent(filename);
  setEditorHydla(content);
}

// 選択された Hydla ファイルの中から最後のファイル名を返す（通常1つしか選択できない）
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

// Base64 の仕様で 76 文字で改行されてしまうので改行記号を取り除く
async function getContent(filename: string) {
  const url = `${path}/${filename}`;
  const res = await fetch(url);
  const json = await res.json();
  const encodedContent = json.content.replace(/\n/g, '');
  const content = atob(encodedContent);
  return content;
}

function isHydlaFile(s: string) {
  return s.endsWith('.hydla');
}
