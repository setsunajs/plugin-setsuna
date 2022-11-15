import { types } from "@babel/core"
import { createHash } from "./createHash"

export function injectHMRInfo({ id, body }) {
  const hash = createHash(id)
  const componentNames = new Set()
  const hmrComponent = []

  for (let index = 0; index < body.length; index++) {
    let node = body[index]
    let useNode = node
    const isExport = isExportDeclaration(node)

    if (isExport && node.specifiers && node.specifiers.length > 0) {
      return node.specifiers.forEach(item => {
        const name = item.exported.name
        if (componentNames.has(name)) {
          hmrComponent.push(name)
          body.splice(index + 1, 0, ...resolveHMRNode(name, hash, id))
        }
      })
    }

    if (isExport) {
      node = useNode = node.declaration
    }

    if (node.type === "VariableDeclaration") {
      node = node.declarations.slice(-1)[0]
      useNode = node.init
    }

    const res = isAllowFunctionType(useNode, false)
    if (res) {
      if (!node.id) {
        hmrComponent.push("__default__")
        body.splice(index + 1, 0, ...resolveHMRNode(name, hash, id))
        return
      }
      const name = node.id.name
      componentNames.add(name)

      if (isExport) {
        hmrComponent.push(name)
        body.splice(index + 1, 0, ...resolveHMRNode(name, hash, id))
      }
    }
  }
  return hmrComponent
}

function isExportDeclaration({ type }) {
  return ["ExportNamedDeclaration", "ExportDefaultDeclaration"].includes(type)
}

function isAllowFunction(node, done) {
  if (isAsync(node)) {
    return false
  }

  let body = node.body
  if (body.type === "BlockStatement") {
    body = body.body

    const returnStatement = body.find(node => node.type === "ReturnStatement")
    if (!returnStatement) {
      return false
    }

    if (!done) {
      return isAllowFunctionType(returnStatement.argument, true)
    }
  }

  switch (body.type) {
    case "JSXElement":
    case "NullLiteral":
    case "JSXFragment": {
      return true
    }
    default: {
      return false
    }
  }
}

function isAsync(node) {
  return node.async || node.generator
}

function isAllowFunctionType(node, done) {
  return [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression"
  ].includes(node.type)
    ? isAllowFunction(node, done)
    : false
}

function resolveHMRNode(name, hash, id) {
  return [
    types.expressionStatement(
      types.assignmentExpression(
        "=",
        types.memberExpression(
          types.Identifier(name),
          types.Identifier("hmrId"),
          false
        ),
        types.stringLiteral(hash)
      )
    ),
    types.expressionStatement(
      types.assignmentExpression(
        "=",
        types.memberExpression(
          types.Identifier(name),
          types.Identifier("file"),
          false
        ),
        types.stringLiteral(id)
      )
    )
  ]
}
