const path = require("node:path")
const pluginCommonjs = require("@rollup/plugin-commonjs")
const { nodeResolve } = require("@rollup/plugin-node-resolve")

module.exports = {
  input: path.resolve(__dirname, "./src/main.js"),
  external: ["@babel/core"],
  plugins: [pluginCommonjs({ sourceMap: false }), nodeResolve()],
  output: {
    file: "./dist/plugin-setsuna.cjs",
    sourcemap: false,
    externalLiveBindings: false,
    format: "cjs"
  }
}
