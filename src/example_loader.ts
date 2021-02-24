import { setEditorHydla } from './editor_control';

/**
 * HyLaGIのレポジトリから例題を取得する
 */
export class ExampleLoader {
  static names: string[] = [];
  static contents = new Map<string, string>();
  static readonly path = 'https://api.github.com/repos/HydLa/HyLaGI/contents/examples';

  static init() {
    this.loadExamples();
  }

  static loadExamples() {
    fetch(this.path)
      .then((res) => res.json())
      .then((json) => {
        // 例題ディレクトリからHydLaプログラムのファイル名を取得
        for (const f of json) {
          if (f.name.indexOf('.hydla') != -1) {
            this.names.push(f.name);
          }
        }
      })
      .then(() => {
        // 選択可能な例題に取得したファイル名を追加
        for (const name of this.names) {
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
        for (const name of this.names) {
          const url = `${this.path}/${name}`;
          fetch(url)
            .then((res) => res.json())
            .then((json) => {
              const encoded_content = json.content.replace(/\n/g, '');
              const content = atob(encoded_content);
              this.contents.set(name, content);
            });
        }
      });

    document.getElementById('load-examples-button')?.addEventListener('click', () => {
      this.loadContents();
    });
  }

  static loadContents() {
    const selected = document.getElementsByClassName('selected');
    let fileindex = -1;
    for (let i = 0; i < selected.length; i++)
      if ((<string>selected[i].textContent).indexOf('.hydla') != -1) fileindex = i;
    if (fileindex == -1) return;
    const filename = <string>selected[fileindex].textContent;

    if (this.contents.has(filename)) setEditorHydla(<string>this.contents.get(filename));
  }
}
