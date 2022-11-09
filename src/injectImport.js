import { types } from "@babel/core"

export function injectImport(path) {
  path.node.body.unshift(
    types.importDeclaration(
      [
        types.ImportSpecifier(types.Identifier("jsx"), types.Identifier("jsx")),
        types.ImportSpecifier(
          types.Identifier("Fragment"),
          types.Identifier("Fragment")
        )
      ],
      types.StringLiteral("setsuna")
    )
  )
}
