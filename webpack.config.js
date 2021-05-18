const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: 'web',
  entry: ["./app/src/index.ts"],
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, "app/dist"),
    filename: "bundle.js",
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify")
    }
  },
  module: {
    rules: [
      {
        // loads .html files
        test: /\.(html)$/,
        include: [path.resolve(__dirname, "app/src")],
        use: {
          loader: "html-loader",
          options: {
            sources: {
              "list": [{
                "tag": "img",
                "attribute": "data-src",
                "type": "src"
              }]
            }
          }
        }
      },
      {
        test: /\.ts$/,
        use: [
          { loader: "ts-loader", options: {
            // transpileOnly: true,
          }},
        ],
        resolve: {
          extensions: [".ts", ".json"]
        }
      },

      /*
      // loads .js/jsx files
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, "app/src")],
        loader: "babel-loader",
        resolve: {
          extensions: [".js", ".jsx", ".json"]
        }
      },
      */

      // loads .css files
      {
        test: /\.s{0,1}css$/,
        include: [
          path.resolve(__dirname, "app/src"),
          path.resolve(__dirname, "node_modules/"),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
        resolve: {
          extensions: [".css"]
        }
      },
      // loads common image formats
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
        use: "url-loader"
      }
    ]
  },
  plugins: [

    new CopyPlugin({
      patterns: [
        {from: 'app/treb', to: 'treb', },
      ]
    }),

    // fix "process is not defined" error;
    // https://stackoverflow.com/a/64553486/1837080
    new webpack.ProvidePlugin({
      process: "process/browser.js",
    }),
  ]
};
