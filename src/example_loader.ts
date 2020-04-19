export class ExampleLoader {
  static names: string[] = [];
  static contents = new Map<string, string>();
  static readonly path = "https://api.github.com/repos/HydLa/HyLaGI/contents/examples";

  static init() {
    this.loadExamples();
  }

  static loadExamples() {
    fetch(this.path)
      .then((res) => res.json())
      .then((json) => { // 例題ディレクトリからHydLaプログラムのファイル名を取得
        for (let f of json) {
          if (f.name.indexOf('.hydla') != -1) {
            this.names.push(f.name);
          }
        }
      })
      .then(() => { // 選択可能な例題に取得したファイル名を追加
        for (let name of this.names) {
          let select = <HTMLElement>document.getElementById("example_selector");
          console.log(name);
          let option = document.createElement("option");
          option.text = name;
          option.value = name;
          select.appendChild(option);
        }
      });
    /*
    .then(() => { // 各HydLaプログラムの中身を取得
      for (let name of this.names) {
        let url = this.path + "/" + name;
        fetch(url)
          .then((res) => res.json())
          .then((json) => {
            let encoded_content = json.content.replace(/\n/g, '');
            let content = atob(encoded_content);
            this.contents.set(name, content);
          })
      }
    });
    */
  }
}