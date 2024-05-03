"use strict";

const { types, operator } = require("putout");

const { replaceWith } = operator;

let importName = "";

module.exports.report = () => `Use clsx instead of classnames`;

module.exports.fix = (path) => {
  const { node } = path;

  if (types.isImportDeclaration(node)) {
    replaceWith(
      path,
      types.importDeclaration(
        [types.importDefaultSpecifier(types.identifier("clsx"))],
        types.stringLiteral("clsx")
      )
    );
    return;
  }

  if (
    types.isCallExpression(node) &&
    types.isIdentifier(node.callee, { name: importName })
  ) {
    replaceWith(
      path,
      types.callExpression(types.identifier("clsx"), node.arguments)
    );
    return;
  }
};

module.exports.traverse = ({ push }) => {
  return {
    ImportDeclaration(path) {
      const { node } = path;

      if (node.source.value === "classnames") {
        importName = node.specifiers[0].local.name;
        push(path);
      }
    },
    CallExpression(path) {
      const { node } = path;

      if (types.isIdentifier(node.callee, { name: importName })) {
        push(path);
      }
    },
  };
};
