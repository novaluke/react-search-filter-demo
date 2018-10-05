import { CheckerPlugin } from "awesome-typescript-loader";
import CleanWebpackPlugin from "clean-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import webpack from "webpack";

const pathTo = (relPath: string) => path.resolve(__dirname, relPath);
const outputPath = pathTo("dist");

module.exports = {
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "awesome-typescript-loader",
      },
    ],
  },
  output: {
    filename: "bundle-[hash].js",
    path: outputPath,
  },
  plugins: [
    new CleanWebpackPlugin([outputPath]),
    new CheckerPlugin(),
    new HtmlWebpackPlugin({ template: pathTo("src/index.html") }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    plugins: [new TsconfigPathsPlugin()],
  },
} as webpack.Configuration;
