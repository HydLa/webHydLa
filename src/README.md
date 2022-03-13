# クライアントサイドのモジュール

> ドキュメント作成は「口伝」の作業量を減らすために重要だと思っています．
> 現状とりあえず README を作ったくらいなので，
> 手の空いている時に改善してもらえると良いと思います．

web 上のエディタで hydla コードを入力させ，
run ボタンを押されると server.py（サーバサイド）と通信して
サーバサイドで hylagi を実行する．
hylagi の実行が終わると，結果（hydat）を受信し，グラフとして描画する．

## モジュール構成の概要

エントリポイントは main.ts

```sh
├── UI
│   ├── dom.ts # dom 操作のための補助的モジュール
│   └── newUI.ts # （昔は古い方の UI もあったらしい）
├── __tests__ # Jest を用いたテスト
│   └── parse.test.ts # parse のテスト（現在これしかないので要拡充）
├── editor
│   ├── editor.ts # エディタの操作
│   ├── example.ts # 例題の読み込み
│   └── hylagi.ts # サーバサイドの hylagi との通信を行う
├── graph # グラフの描画や設定など
│   ├── animation.ts
│   ├── animationUtils.ts
│   ├── datGUI.ts
│   ├── graph.ts
│   ├── plot.ts
│   ├── plotLine.ts
│   ├── plotLineMap.ts
│   ├── plotSettings.ts
│   └── plotUtils.ts
├── hydat # hydat (= hylagi の実行結果) に関連する操作を行う
│   ├── hydat.ts
│   └── parse.ts # hydat の parse 用モジュール
├── main.ts # エントリーポイント
└── storage.ts # localStorage の操作
```

---

以下，過去のスライドから引っ張ってきたもの
（少し古いが，これを参考に上に追記してください）

- main.ts：エントリーポイント
- dom_control.ts：画面全般の操作
- editor_control.ts：エディタの操作
- example_loader.ts：例題の読み込み
- hylagi.ts：HyLaGI の呼び出し
- hydat.ts：hydat
- parse.ts：hydat のパース
- hydat_control.ts：hydat の保存，読み込み
- storage_control.ts：localStorage の操作
- graph_control.ts：3D 描画全般の操作
- animation_control.ts：3D オブジェクトの操作
- plot_control.ts：背景や軸
- plot_line.ts：3D の線
- plot_line_map_control.ts：3D の線の操作
- dat_gui_control.ts：描画パラメータ GUI

---

html や css などの静的ファイルは webHydLa/static/ 内に存在している．

- この構成は正しいのか？
  - public みたいなものと，
    生成されたファイルを管理する build みたいなもので分けて使うべきでは

## 依存しているパッケージに関する補足

- datGUI はパラメータの調整などを行うための GUI を提供するパッケージ
- グラフの描画には，three.js を用いている．
- Jest は単体テストのためのパッケージ．

## Discussion

- graph directory に datGUI によるプロット設定と，
  グラフの描画ためのコードが両方入っていて，
  少し大きいのが気になる．
- react とか vue とか入れたい．
- （個人的には elm architecture っぽい感じにしたい）
