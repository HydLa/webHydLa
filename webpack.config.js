const webpack = require("webpack");

module.exports = { 
  entry: `${__dirname}/src/main.ts`,
  output: {
    path: `${__dirname}/static`,
    filename: 'main.js'
  },
  mode: 'development',
  // mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader"
      }
    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    alias: {
      jquery: `${__dirname}/node_modules/jquery`
    },
    extensions: [".ts", ".js"]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    })
  ]
};
