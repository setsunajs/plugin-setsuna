import { transformSync } from "@babel/core"
import { injectHMRInfo } from "./injectHMRInfo"
import { injectImport } from "./injectImport"
import { types } from "@babel/core"
import { injectAutoReload } from "./injectAutoReload"

const regJsx = /.*?\.(js|ts)x$/
export function setsunaPlugin() {
  let isProd = false
  return {
    name: "vite:setsuna",

    config(config, options) {
      isProd = options.mode === "production"

      return {
        esbuild: {
          include: /\.(ts|js)$/
        }
      }
    },

    async transform(source, id) {
      if (!regJsx.test(id)) return

      let hasRender = false
      let hasDefineElement = false
      let hmrComponent = null
      const result = transformSync(source, {
        ast: true,
        sourceMaps: true,
        sourceFileName: id,
        babelrc: false,
        configFile: false,
        plugins: [
          [
            require("@babel/plugin-transform-react-jsx"),
            {
              runtime: "classic",
              pragma: "jsx",
              pragmaFrag: "Fragment",
              useBuiltIns: true
            }
          ],
          id.endsWith("tsx") && [
            require("@babel/plugin-transform-typescript"),
            {
              isTSX: true,
              allExtensions: true
            }
          ],
          {
            visitor: {
              Program(path) {
                hmrComponent = injectHMRInfo({ id, body: path.node.body })
                injectImport(path)
              },
              ImportSpecifier(path) {
                if (
                  path.parentPath.node.source.value === "@setsunajs/setsuna" &&
                  path.node.imported.name === "render" &&
                  path.scope.getBinding("render").referencePaths.length > 0
                ) {
                  hasRender = true
                }

                if (
                  path.parentPath.node.source.value === "@setsunajs/setsuna" &&
                  path.node.imported.name === "defineElement" &&
                  path.scope.getBinding("defineElement").referencePaths.length >
                    0
                ) {
                  hasDefineElement = true
                }
              },
              ExportDefaultDeclaration(path) {
                if (!path.node.declaration.id) {
                  path.node.declaration.id = types.identifier("__default__")
                }
              }
            }
          }
        ].filter(Boolean)
      })

      if (!isProd) {
        injectAutoReload({ result, hasRender, hasDefineElement, hmrComponent })
      }

      return {
        code: result.code,
        map: result.map
      }
    }
  }
}
