import { EditorControl } from './editor_control';

/**
 * HyLaGIのレポジトリから例題を取得する
 */

const path = 'https://api.github.com/repos/HydLa/HyLaGI/contents/examples';

export interface ExampleLoaderState {
  names: string[];
  contents: Map<string, string>;
}

const exampleLoaderState: ExampleLoaderState = {
  names: [],
  contents: new Map<string, string>(),
};

export function initExampleLoader() {
  loadExamples();
}

function loadExamples() {
  fetch(path)
    .then((res) => res.json())
    .then((json) => {
      // 例題ディレクトリからHydLaプログラムのファイル名を取得
      for (const f of json) {
        if (f.name.indexOf('.hydla') != -1) {
          exampleLoaderState.names.push(f.name);
        }
      }
    })
    .then(() => {
      // 選択可能な例題に取得したファイル名を追加
      for (const name of exampleLoaderState.names) {
        const select = <HTMLElement>document.getElementById('example_selector');
        const option = document.createElement('option');
        option.text = name;
        option.value = name;
        select.appendChild(option);
      }
      (<any>$('#example_selector')).formSelect();
    })
    .then(() => {
      // 各HydLaプログラムの中身を取得
      for (const name of exampleLoaderState.names) {
        const url = `${path}/${name}`;
        fetch(url)
          .then((res) => res.json())
          .then((json) => {
            const encoded_content = json.content.replace(/\n/g, '');
            const content = atob(encoded_content);
            exampleLoaderState.contents.set(name, content);
          });
      }
    });

  document.getElementById('load-examples-button')?.addEventListener('click', () => {
    loadContents();
  });
}

function loadContents() {
  const selected = document.getElementsByClassName('selected');
  let fileindex = -1;
  for (let i = 0; i < selected.length; i++)
    if ((<string>selected[i].textContent).indexOf('.hydla') != -1) fileindex = i;
  if (fileindex == -1) return;
  const filename = <string>selected[fileindex].textContent;

  if (exampleLoaderState.contents.has(filename))
    EditorControl.editor.setValue(<string>exampleLoaderState.contents.get(filename));
}
